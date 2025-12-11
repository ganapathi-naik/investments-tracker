import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { loadInvestments } from '../utils/storage';

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
  switch (investment.type) {
    case 'FIXED_DEPOSIT':
    case 'POST_OFFICE_TD':
      return `${investment.bankName || 'Fixed Deposit'}`;

    case 'RECURRING_DEPOSIT':
    case 'POST_OFFICE_RD':
      return `${investment.bankName || 'Recurring Deposit'}`;

    case 'POST_OFFICE_SCSS':
      return 'Post Office SCSS';

    case 'POST_OFFICE_MIS':
      return 'Post Office MIS';

    case 'POST_OFFICE_KVP':
      return 'Kisan Vikas Patra';

    case 'POST_OFFICE_NSC':
      return 'National Savings Certificate';

    case 'BONDS':
      return `${investment.bondName || 'Bond'}`;

    case 'SGB':
      return 'Sovereign Gold Bond';

    case 'INSURANCE':
      return `${investment.policyName || 'Insurance Policy'}`;

    default:
      return 'Investment';
  }
};

// Schedule notification for a specific date
const scheduleNotification = async (investment, daysUntilMaturity, maturityDate) => {
  const investmentName = getInvestmentName(investment);
  const notificationDate = new Date();

  // Calculate when to show the notification
  const daysToNotify = 7 - daysUntilMaturity; // Days from today
  notificationDate.setDate(notificationDate.getDate() + daysToNotify);
  notificationDate.setHours(9, 0, 0, 0); // 9 AM

  let title, body;

  if (daysUntilMaturity === 0) {
    title = '🎯 Investment Maturing Today!';
    body = `${investmentName} is maturing today!`;
  } else if (daysUntilMaturity === 1) {
    title = '⚠️ Investment Maturing Tomorrow!';
    body = `${investmentName} will mature tomorrow`;
  } else {
    title = `📅 Investment Maturing in ${daysUntilMaturity} days`;
    body = `${investmentName} will mature on ${new Date(maturityDate).toLocaleDateString()}`;
  }

  try {
    const trigger = {
      date: notificationDate,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          investmentId: investment.id,
          type: investment.type,
          maturityDate,
        },
        categoryIdentifier: 'maturity-alert',
      },
      trigger,
    });

    console.log(`Scheduled notification for ${investmentName} in ${daysToNotify} days (${daysUntilMaturity} days until maturity)`);
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

    // One week from now
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    let scheduledCount = 0;

    for (const investment of investments) {
      const maturityDateStr = getMaturityDate(investment);

      if (!maturityDateStr) continue;

      const maturityDate = new Date(maturityDateStr);
      maturityDate.setHours(0, 0, 0, 0);

      // Check if maturity date is within the next 7 days
      if (maturityDate >= today && maturityDate <= oneWeekFromNow) {
        const daysUntilMaturity = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));

        // Schedule notifications for each day from now until maturity
        for (let day = daysUntilMaturity; day >= 0; day--) {
          await scheduleNotification(investment, day, maturityDateStr);
          scheduledCount++;
        }
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
    await scheduleMaturityNotifications();
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
