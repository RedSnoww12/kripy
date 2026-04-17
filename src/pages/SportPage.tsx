import { useState } from 'react';
import SportTypeSelector from '@/components/sport/SportTypeSelector';
import MuscuForm from '@/components/sport/MuscuForm';
import OtherSportForm from '@/components/sport/OtherSportForm';
import WorkoutHistory from '@/components/sport/WorkoutHistory';
import type { SportCategory } from '@/types';

export default function SportPage() {
  const [category, setCategory] = useState<SportCategory>('muscu');

  return (
    <div className="tp active">
      <SportTypeSelector value={category} onChange={setCategory} />
      {category === 'muscu' ? (
        <MuscuForm />
      ) : (
        <OtherSportForm category={category} />
      )}
      <WorkoutHistory />
    </div>
  );
}
