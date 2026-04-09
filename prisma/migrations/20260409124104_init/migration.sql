-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "email" TEXT,
    "photo_url" TEXT,
    "height" INTEGER NOT NULL DEFAULT 175,
    "goal_weight" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "steps_goal" INTEGER NOT NULL DEFAULT 10000,
    "activity_level" TEXT NOT NULL DEFAULT 'moderate',
    "phase" TEXT NOT NULL DEFAULT 'A',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "setup_done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL DEFAULT 2200,
    "prot" INTEGER NOT NULL DEFAULT 150,
    "gluc" INTEGER NOT NULL DEFAULT 250,
    "lip" INTEGER NOT NULL DEFAULT 75,
    "fib" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paliers" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weights" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_log_days" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_log_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "id" TEXT NOT NULL,
    "log_day_id" TEXT NOT NULL,
    "food" TEXT NOT NULL,
    "meal" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "prot" DOUBLE PRECISION NOT NULL,
    "gluc" DOUBLE PRECISION NOT NULL,
    "lip" DOUBLE PRECISION NOT NULL,
    "fib" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "glasses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "steps_logs" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "steps_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "calories" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_muscles" (
    "id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,

    CONSTRAINT "workout_muscles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "prot" DOUBLE PRECISION NOT NULL,
    "gluc" DOUBLE PRECISION NOT NULL,
    "lip" DOUBLE PRECISION NOT NULL,
    "fib" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_meals" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_meal_items" (
    "id" TEXT NOT NULL,
    "saved_meal_id" TEXT NOT NULL,
    "food" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "prot" DOUBLE PRECISION NOT NULL,
    "gluc" DOUBLE PRECISION NOT NULL,
    "lip" DOUBLE PRECISION NOT NULL,
    "fib" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "saved_meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "food_name" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "targets_profile_id_key" ON "targets"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "paliers_profile_id_key" ON "paliers"("profile_id");

-- CreateIndex
CREATE INDEX "weights_profile_id_date_idx" ON "weights"("profile_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "weights_profile_id_date_key" ON "weights"("profile_id", "date");

-- CreateIndex
CREATE INDEX "meal_log_days_profile_id_date_idx" ON "meal_log_days"("profile_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "meal_log_days_profile_id_date_key" ON "meal_log_days"("profile_id", "date");

-- CreateIndex
CREATE INDEX "meal_items_log_day_id_idx" ON "meal_items"("log_day_id");

-- CreateIndex
CREATE UNIQUE INDEX "water_logs_profile_id_date_key" ON "water_logs"("profile_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "steps_logs_profile_id_date_key" ON "steps_logs"("profile_id", "date");

-- CreateIndex
CREATE INDEX "workouts_profile_id_date_idx" ON "workouts"("profile_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_profile_id_name_key" ON "recipes"("profile_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "saved_meals_profile_id_name_key" ON "saved_meals"("profile_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_profile_id_food_name_key" ON "favorites"("profile_id", "food_name");

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paliers" ADD CONSTRAINT "paliers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weights" ADD CONSTRAINT "weights_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_log_days" ADD CONSTRAINT "meal_log_days_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_log_day_id_fkey" FOREIGN KEY ("log_day_id") REFERENCES "meal_log_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steps_logs" ADD CONSTRAINT "steps_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_muscles" ADD CONSTRAINT "workout_muscles_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_meals" ADD CONSTRAINT "saved_meals_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_meal_items" ADD CONSTRAINT "saved_meal_items_saved_meal_id_fkey" FOREIGN KEY ("saved_meal_id") REFERENCES "saved_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
