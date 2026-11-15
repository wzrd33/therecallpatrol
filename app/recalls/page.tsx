import { redirect } from 'next/navigation';

// The old page here listed made-up sample recalls. The real feed lives on the home page.
export default function RecallsPage() {
  redirect('/#now-recalled');
}
