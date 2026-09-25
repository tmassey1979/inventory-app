# Home screen widget ("To ship")

True iOS/Android home-screen widgets require a development build (not Expo Go)
and native widget extensions. In this app:

- Dashboard shows a live **To Ship** count (items with status Packed).
- Tools → Shipping checklist prints all Packed items.

To add a real widget later:
1. `npx expo prebuild`
2. Add an iOS WidgetKit extension / Android App Widget that reads a shared
   App Group / SharedPreferences value written by the app on each dashboard refresh.
