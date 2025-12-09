import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tours/index" />
      <Stack.Screen name="tours/create" />
      <Stack.Screen name="tours/[id]" />
      <Stack.Screen name="pois/index" />
      <Stack.Screen name="pois/[tourId]" />
      <Stack.Screen name="qrs/index" />
    </Stack>
  );
}
