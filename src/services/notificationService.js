import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { loadInvestments } from '../utils/storage';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('maturity-alerts', {
        name: 'Investment Maturity Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90E2',
      });

      await Notifications.setNotificationChannelAsync('payment-reminders', {
        name: 'Payment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#27AE60',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Get maturity date for an investment
const getMaturityDate = (investment) => {
  switch (investment.type) {
    case 'FIXED_DEPOSIT':
    case 'POST_OFFICE_TD':
      return investment.maturityDate;

    case 'RECURRING_DEPOSIT':
    case 'POST_OFFICE_RD':
      return investment.maturityDate;

    case 'POST_OFFICE_SCSS':
    case 'POST_OFFICE_MIS':
      return investment.maturityDate;

    case 'POST_OFFICE_KVP':
    case 'POST_OFFICE_NSC':
      return investment.maturityDate;

    case 'BONDS':
    case 'SGB':
      return investment.maturityDate;

    case 'INSURANCE':
      return investment.maturityDate;

    default:
      return null;
  }
};

// Get investment name for notification
const getInvestmentName = (investment) => {
  // First check if investmentName exists (custom name field available for all types)
  if (investment.investmentName) {
    return investment.investmentName;
  }

  // Otherwise, fall back to type-specific names or bank names
  switch (investment.type) {
    case 'FIXED_DEPOSIT':
    case 'POST_OFFICE_TD':
      return investment.bankName || 'Fixed Deposit';

    case 'RECURRING_DEPOSIT':
    case 'POST_OFFICE_RD':
      return investment.bankName || 'Recurring Deposit';

    case 'POST_OFFICE_SCSS':
      return 'Post Office SCSS';

    case 'POST_OFFICE_MIS':
      return 'Post Office MIS';

    case 'POST_OFFICE_KVP':
      return 'Kisan Vikas Patra';

    case 'POST_OFFICE_NSC':
      return 'National Savings Certificate';

    case 'BONDS':
      return investment.bondName || 'Bond';

    case 'SGB':
      return 'Sovereign Gold Bond';

    case 'INSURANCE':
      return investment.policyName || 'Insurance Policy';

    default:
      return 'Investment';
  }
};

// Schedule notification for a specific date (at 9 AM and 4 PM)
const scheduleNotification = async (investment, daysUntilMaturity, maturityDate) => {
  const investmentName = getInvestmentName(investment);
  const investmentType = INVESTMENT_TYPES[investment.type];
  const typeName = investmentType?.name || 'Investment';

  const now = new Date();

  // Schedule notification at 9 AM
  const morningNotification = new Date();
  morningNotification.setHours(9, 0, 0, 0);

  // If it's already past 9 AM today, schedule for tomorrow
  if (daysUntilMaturity === 0 && now.getHours() >= 9) {
    morningNotification.setDate(morningNotification.getDate() + 1);
  }

  // Schedule notification at 4 PM
  const eveningNotification = new Date();
  eveningNotification.setHours(16, 0, 0, 0);

  // If it's already past 4 PM today, schedule for tomorrow
  if (daysUntilMaturity === 0 && now.getHours() >= 16) {
    eveningNotification.setDate(eveningNotification.getDate() + 1);
  }

  let title, body;

  if (daysUntilMaturity === 0) {
    title = `🎯 ${typeName} Maturing Today!`;
    body = `${investmentName} is maturing today!`;
  } else if (daysUntilMaturity === 1) {
    title = `⚠️ ${typeName} Maturing Tomorrow!`;
    body = `${investmentName} will mature tomorrow`;
  } else {
    title = `📅 ${typeName} Maturing in ${daysUntilMaturity} days`;
    body = `${investmentName} will mature on ${new Date(maturityDate).toLocaleDateString()}`;
  }

  try {
    // Schedule morning notification (9 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          investmentId: investment.id,
          type: investment.type,
          maturityDate,
          time: 'morning',
        },
        categoryIdentifier: 'maturity-alert',
      },
      trigger: {
        date: morningNotification,
      },
    });

    // Schedule evening notification (4 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          investmentId: investment.id,
          type: investment.type,
          maturityDate,
          time: 'evening',
        },
        categoryIdentifier: 'maturity-alert',
      },
      trigger: {
        date: eveningNotification,
      },
    });

    console.log(`Scheduled notifications for ${investmentName} at 9 AM and 4 PM (${daysUntilMaturity} days until maturity)`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

// Schedule maturity notifications for all investments
export const scheduleMaturityNotifications = async () => {
  try {
    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Load all investments
    const investments = await loadInvestments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Notify for investments maturing in next 7 days
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let scheduledCount = 0;

    for (const investment of investments) {
      const maturityDateStr = getMaturityDate(investment);

      if (!maturityDateStr) continue;

      const maturityDate = new Date(maturityDateStr);
      maturityDate.setHours(0, 0, 0, 0);

      // Check if maturity date is within the next 7 days
      if (maturityDate >= today && maturityDate <= sevenDaysFromNow) {
        const daysUntilMaturity = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));

        // Schedule notifications at 9 AM and 4 PM (only 2 per day)
        await scheduleNotification(investment, daysUntilMaturity, maturityDateStr);
        scheduledCount++;
      }
    }

    console.log(`Scheduled ${scheduledCount} maturity notifications`);
    return scheduledCount;
  } catch (error) {
    console.error('Error scheduling maturity notifications:', error);
    return 0;
  }
};

// Check and schedule notifications on app start
export const initializeNotifications = async () => {
  const hasPermission = await requestNotificationPermissions();

  if (hasPermission) {
    await scheduleAllNotifications();
  }

  return hasPermission;
};

// Get all scheduled notifications (for debugging)
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications:', notifications);
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Get next payment date for RD (always 15th of every month)
const getNextRDPaymentDate = (investment) => {
  if (!investment.startDate || !investment.maturityDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(investment.startDate);
  const maturityDate = new Date(investment.maturityDate);

  // If investment has matured, no more payments
  if (today >= maturityDate) return null;

  // RD payment day is always 15th of every month
  const paymentDay = 15;

  // Calculate next payment date (15th of current or next month)
  const nextPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay);

  // If payment day has passed this month, move to next month
  if (nextPayment < today) {
    nextPayment.setMonth(nextPayment.getMonth() + 1);
  }

  // Ensure next payment is before maturity
  if (nextPayment > maturityDate) return null;

  return nextPayment;
};

// Schedule RD payment notification (at 9 AM and 4 PM)
const scheduleRDPaymentNotification = async (investment, paymentDate, daysUntilPayment) => {
  const investmentName = getInvestmentName(investment);
  const investmentType = INVESTMENT_TYPES[investment.type];
  const typeName = investmentType?.name || 'RD';
  const monthlyAmount = investment.monthlyDeposit || 0;

  const now = new Date();

  // Schedule notification at 9 AM
  const morningNotification = new Date();
  morningNotification.setHours(9, 0, 0, 0);

  // If it's already past 9 AM today, schedule for tomorrow
  if (daysUntilPayment === 0 && now.getHours() >= 9) {
    morningNotification.setDate(morningNotification.getDate() + 1);
  }

  // Schedule notification at 4 PM
  const eveningNotification = new Date();
  eveningNotification.setHours(16, 0, 0, 0);

  // If it's already past 4 PM today, schedule for tomorrow
  if (daysUntilPayment === 0 && now.getHours() >= 16) {
    eveningNotification.setDate(eveningNotification.getDate() + 1);
  }

  let title, body;

  if (daysUntilPayment === 0) {
    title = `💰 ${typeName} Payment Due Today!`;
    body = `${investmentName}: Payment of ₹${monthlyAmount.toLocaleString('en-IN')} is due today`;
  } else if (daysUntilPayment === 1) {
    title = `⏰ ${typeName} Payment Due Tomorrow!`;
    body = `${investmentName}: Payment of ₹${monthlyAmount.toLocaleString('en-IN')} is due tomorrow`;
  } else {
    title = `📅 ${typeName} Payment in ${daysUntilPayment} days`;
    body = `${investmentName}: Payment of ₹${monthlyAmount.toLocaleString('en-IN')} is due on ${paymentDate.toLocaleDateString()}`;
  }

  try {
    // Schedule morning notification (9 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          investmentId: investment.id,
          type: investment.type,
          paymentDate: paymentDate.toISOString(),
          amount: monthlyAmount,
          time: 'morning',
        },
        categoryIdentifier: 'payment-reminder',
      },
      trigger: {
        date: morningNotification,
      },
    });

    // Schedule evening notification (4 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          investmentId: investment.id,
          type: investment.type,
          paymentDate: paymentDate.toISOString(),
          amount: monthlyAmount,
          time: 'evening',
        },
        categoryIdentifier: 'payment-reminder',
      },
      trigger: {
        date: eveningNotification,
      },
    });

    console.log(`Scheduled RD payment notifications for ${investmentName} at 9 AM and 4 PM (${daysUntilPayment} days until payment)`);
  } catch (error) {
    console.error('Error scheduling RD payment notification:', error);
  }
};

// Schedule RD payment notifications
export const scheduleRDPaymentNotifications = async () => {
  try {
    // Load all investments
    const investments = await loadInvestments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Notify 7 days before the payment day (same as FD maturity)
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let scheduledCount = 0;

    for (const investment of investments) {
      // Only for RD investments
      if (investment.type !== 'RECURRING_DEPOSIT' && investment.type !== 'POST_OFFICE_RD') {
        continue;
      }

      const nextPaymentDate = getNextRDPaymentDate(investment);

      if (!nextPaymentDate) continue;

      // Check if payment date is within the next 7 days
      if (nextPaymentDate >= today && nextPaymentDate <= sevenDaysFromNow) {
        const daysUntilPayment = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));

        // Schedule notifications at 9 AM and 4 PM (only 2 per day)
        await scheduleRDPaymentNotification(investment, nextPaymentDate, daysUntilPayment);
        scheduledCount++;
      }
    }

    console.log(`Scheduled ${scheduledCount} RD payment notifications`);
    return scheduledCount;
  } catch (error) {
    console.error('Error scheduling RD payment notifications:', error);
    return 0;
  }
};

// Get next premium payment date for Insurance based on frequency
const getNextInsurancePremiumDate = (investment) => {
  if (!investment.startDate || !investment.maturityDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(investment.startDate);
  const maturityDate = new Date(investment.maturityDate);

  // If policy has matured, no more payments
  if (today >= maturityDate) return null;

  // Get premium frequency (default to monthly)
  const frequency = (investment.premiumFrequency || 'monthly').toLowerCase();

  let nextPayment;

  if (frequency === 'monthly') {
    // Monthly: 1st of every month
    const paymentDay = 1;
    nextPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay);

    // If payment day has passed this month, move to next month
    if (nextPayment < today) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
  } else if (frequency === 'quarterly') {
    // Quarterly: Every 3 months from start date
    nextPayment = new Date(startDate);

    // Calculate which quarter we're in
    while (nextPayment < today) {
      nextPayment.setMonth(nextPayment.getMonth() + 3);
    }
  } else if (frequency === 'half-yearly' || frequency === 'halfyearly') {
    // Half-Yearly: Every 6 months from start date
    nextPayment = new Date(startDate);

    // Calculate which half-year period we're in
    while (nextPayment < today) {
      nextPayment.setMonth(nextPayment.getMonth() + 6);
    }
  } else if (frequency === 'yearly' || frequency === 'annually') {
    // Yearly: Once a year from start date (same month and day)
    nextPayment = new Date(startDate);

    // Calculate which year we're in
    while (nextPayment < today) {
      nextPayment.setFullYear(nextPayment.getFullYear() + 1);
    }
  } else {
    // Default to monthly if invalid frequency
    const paymentDay = 1;
    nextPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay);

    if (nextPayment < today) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
  }

  // Ensure next payment is before maturity
  if (nextPayment > maturityDate) return null;

  return nextPayment;
};

// Schedule Insurance premium payment notification (at 9 AM and 4 PM)
const scheduleInsurancePremiumNotification = async (investment, paymentDate, daysUntilPayment) => {
  const investmentName = getInvestmentName(investment);
  const investmentType = INVESTMENT_TYPES[investment.type];
  const typeName = investmentType?.name || 'Insurance';
  const premiumAmount = investment.premiumAmount || 0;

  const now = new Date();

  // Schedule notification at 9 AM
  const morningNotification = new Date();
  morningNotification.setHours(9, 0, 0, 0);

  // If it's already past 9 AM today, schedule for tomorrow
  if (daysUntilPayment === 0 && now.getHours() >= 9) {
    morningNotification.setDate(morningNotification.getDate() + 1);
  }

  // Schedule notification at 4 PM
  const eveningNotification = new Date();
  eveningNotification.setHours(16, 0, 0, 0);

  // If it's already past 4 PM today, schedule for tomorrow
  if (daysUntilPayment === 0 && now.getHours() >= 16) {
    eveningNotification.setDate(eveningNotification.getDate() + 1);
  }

  let title, body;

  if (daysUntilPayment === 0) {
    title = `🛡️ ${typeName} Premium Due Today!`;
    body = `${investmentName}: Premium of ₹${premiumAmount.toLocaleString('en-IN')} is due today`;
  } else if (daysUntilPayment === 1) {
    title = `⏰ ${typeName} Premium Due Tomorrow!`;
    body = `${investmentName}: Premium of ₹${premiumAmount.toLocaleString('en-IN')} is due tomorrow`;
  } else {
    title = `📅 ${typeName} Premium in ${daysUntilPayment} days`;
    body = `${investmentName}: Premium of ₹${premiumAmount.toLocaleString('en-IN')} is due on ${paymentDate.toLocaleDateString()}`;
  }

  try {
    // Schedule morning notification (9 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          investmentId: investment.id,
          type: investment.type,
          paymentDate: paymentDate.toISOString(),
          amount: premiumAmount,
          time: 'morning',
        },
        categoryIdentifier: 'payment-reminder',
      },
      trigger: {
        date: morningNotification,
      },
    });

    // Schedule evening notification (4 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          investmentId: investment.id,
          type: investment.type,
          paymentDate: paymentDate.toISOString(),
          amount: premiumAmount,
          time: 'evening',
        },
        categoryIdentifier: 'payment-reminder',
      },
      trigger: {
        date: eveningNotification,
      },
    });

    console.log(`Scheduled Insurance premium notifications for ${investmentName} at 9 AM and 4 PM (${daysUntilPayment} days until payment)`);
  } catch (error) {
    console.error('Error scheduling Insurance premium notification:', error);
  }
};

// Schedule Insurance premium payment notifications
export const scheduleInsurancePremiumNotifications = async () => {
  try {
    // Load all investments
    const investments = await loadInvestments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Notify 7 days before the payment day (same as RD and FD)
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let scheduledCount = 0;

    for (const investment of investments) {
      // Only for Insurance investments
      if (investment.type !== 'INSURANCE') {
        continue;
      }

      const nextPaymentDate = getNextInsurancePremiumDate(investment);

      if (!nextPaymentDate) continue;

      // Check if payment date is within the next 7 days
      if (nextPaymentDate >= today && nextPaymentDate <= sevenDaysFromNow) {
        const daysUntilPayment = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));

        // Schedule notifications at 9 AM and 4 PM (only 2 per day)
        await scheduleInsurancePremiumNotification(investment, nextPaymentDate, daysUntilPayment);
        scheduledCount++;
      }
    }

    console.log(`Scheduled ${scheduledCount} Insurance premium notifications`);
    return scheduledCount;
  } catch (error) {
    console.error('Error scheduling Insurance premium notifications:', error);
    return 0;
  }
};

// Schedule all notifications (maturity + RD payments + Insurance premiums)
export const scheduleAllNotifications = async () => {
  try {
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule maturity notifications
    const maturityCount = await scheduleMaturityNotifications();

    // Schedule RD payment notifications
    const rdPaymentCount = await scheduleRDPaymentNotifications();

    // Schedule Insurance premium notifications
    const insurancePremiumCount = await scheduleInsurancePremiumNotifications();

    console.log(`Total scheduled: ${maturityCount + rdPaymentCount + insurancePremiumCount} notifications`);
    return {
      maturityCount,
      rdPaymentCount,
      insurancePremiumCount,
      total: maturityCount + rdPaymentCount + insurancePremiumCount
    };
  } catch (error) {
    console.error('Error scheduling all notifications:', error);
    return { maturityCount: 0, rdPaymentCount: 0, insurancePremiumCount: 0, total: 0 };
  }
};
