CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_type" varchar(80) NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"storage_key" varchar(255),
	"file_name" varchar(255),
	"file_size_bytes" integer,
	"failure_message" varchar(255),
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
