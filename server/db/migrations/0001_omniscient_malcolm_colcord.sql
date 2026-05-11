CREATE TABLE "accrual_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"adjustment_date" date NOT NULL,
	"accrual_amount" numeric(8, 2),
	"accrual_frequency" text,
	"note" text DEFAULT '' NOT NULL,
	"semimonthly_first_day" integer,
	"semimonthly_mode" text,
	"semimonthly_second_day" integer,
	"semimonthly_weekday" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accrual_adjustments" ADD CONSTRAINT "accrual_adjustments_user_id_pto_settings_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pto_settings"("user_id") ON DELETE cascade ON UPDATE no action;