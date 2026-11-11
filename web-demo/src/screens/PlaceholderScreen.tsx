/** HistoryScreen / SettingsScreen in App.tsx: both are "Coming soon" in the app. */
export default function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="screen placeholder">
      <h2>{title}</h2>
      <p>Coming soon</p>
    </div>
  );
}
