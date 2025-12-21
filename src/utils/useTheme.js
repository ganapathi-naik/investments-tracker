import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: isDark ? darkTheme : lightTheme,
  };
};
