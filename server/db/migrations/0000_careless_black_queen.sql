CREATE TABLE "balance_corrections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"correction_date" date NOT NULL,
	"balance" numeric(8, 2) NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_paid_holidays" (
	"user_id" text NOT NULL,
	"holiday_date" date NOT NULL,
	CONSTRAINT "custom_paid_holidays_user_id_holiday_date_pk" PRIMARY KEY("user_id","holiday_date")
);
--> statement-breakpoint
CREATE TABLE "pto_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"accrual_amount" numeric(8, 2),
	"accrual_frequency" text DEFAULT '' NOT NULL,
	"initial_setup_complete" boolean DEFAULT false NOT NULL,
	"paid_holiday_ids" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"semimonthly_first_day" integer DEFAULT 1 NOT NULL,
	"semimonthly_mode" text DEFAULT 'daysOfMonth' NOT NULL,
	"semimonthly_second_day" integer DEFAULT 15 NOT NULL,
	"semimonthly_weekday" integer DEFAULT 5 NOT NULL,
	"starting_balance" numeric(8, 2),
	"starting_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_pto" (
	"user_id" text NOT NULL,
	"pto_date" date NOT NULL,
	"hours" numeric(8, 2) NOT NULL,
	CONSTRAINT "scheduled_pto_user_id_pto_date_pk" PRIMARY KEY("user_id","pto_date")
);
--> statement-breakpoint
ALTER TABLE "balance_corrections" ADD CONSTRAINT "balance_corrections_user_id_pto_settings_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pto_settings"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_paid_holidays" ADD CONSTRAINT "custom_paid_holidays_user_id_pto_settings_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pto_settings"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_pto" ADD CONSTRAINT "scheduled_pto_user_id_pto_settings_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pto_settings"("user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
COMMENT ON COLUMN "pto_settings"."user_id" IS 'Neon Auth user id from neon_auth.users_sync.id';
