CREATE TABLE daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  morning_weight FLOAT,
  calories_consumed INT DEFAULT 0,
  daily_steps INT DEFAULT 0,
  current_phase TEXT CHECK (current_phase IN ('pre_prep','deficit','remontee','reverse_diet','prise_masse')),
  calorie_target INT,
  protein_g INT,
  fat_g INT,
  carbs_g INT,
  workout_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  log_date DATE NOT NULL,
  description TEXT,
  calories INT,
  protein_g INT,
  fat_g INT,
  carbs_g INT,
  source TEXT CHECK (source IN ('photo','audio','manual')),
  ai_raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX idx_meals_user_date ON meals(user_id, log_date);
