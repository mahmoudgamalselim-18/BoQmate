#!/usr/bin/env node
// scripts/seed-prices.js
// ─────────────────────────────────────────────────────────────
// Seed script to populate global_resources and global_prices tables
// with realistic Egyptian market prices for 2024-2025
// Usage: node scripts/seed-prices.js
// ─────────────────────────────────────────────────────────────

require("dotenv").config({ path: ".env.local" });


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local"
  );
  process.exit(1);
}

// ============================================================
// Egyptian Market Prices 2024-2025 (Realistic Data)
// ============================================================
const GLOBAL_RESOURCES = [
  // Concrete Materials
  {
    name: "خرسانة جاهزة C25",
    category: "خرسانة",
    unit: "م³",
    price: 1850,
  },
  { name: "خرسانة جاهزة C30", category: "خرسانة", unit: "م³", price: 1950 },
  {
    name: "خرسانة جاهزة C35",
    category: "خرسانة",
    unit: "م³",
    price: 2050,
  },

  // Steel & Rebar
  {
    name: "حديد تسليح Ø8",
    category: "حديد",
    unit: "طن",
    price: 28500,
  },
  {
    name: "حديد تسليح Ø10",
    category: "حديد",
    unit: "طن",
    price: 28200,
  },
  {
    name: "حديد تسليح Ø12",
    category: "حديد",
    unit: "طن",
    price: 28000,
  },
  {
    name: "حديد تسليح Ø14",
    category: "حديد",
    unit: "طن",
    price: 27800,
  },
  {
    name: "حديد تسليح Ø16",
    category: "حديد",
    unit: "طن",
    price: 27600,
  },
  {
    name: "حديد تسليح Ø18",
    category: "حديد",
    unit: "طن",
    price: 27400,
  },
  {
    name: "حديد تسليح Ø20",
    category: "حديد",
    unit: "طن",
    price: 27200,
  },
  {
    name: "حديد تسليح Ø22",
    category: "حديد",
    unit: "طن",
    price: 27000,
  },

  // Cement & Aggregates
  {
    name: "أسمنت بورتلاند عادي",
    category: "مواد إسمنتية",
    unit: "شيكارة 50كج",
    price: 185,
  },
  {
    name: "أسمنت أبيض",
    category: "مواد إسمنتية",
    unit: "شيكارة 50كج",
    price: 850,
  },
  {
    name: "رمل نظيف (نهري)",
    category: "مواد إسمنتية",
    unit: "م³",
    price: 280,
  },
  {
    name: "رمل خشن (حصى 4-8)",
    category: "مواد إسمنتية",
    unit: "م³",
    price: 320,
  },
  {
    name: "حصى خشن (8-15)",
    category: "مواد إسمنتية",
    unit: "م³",
    price: 300,
  },

  // Bricks & Blocks
  {
    name: "طوب أحمر عادي",
    category: "مواد البناء",
    unit: "ألف طوبة",
    price: 1100,
  },
  {
    name: "طوب أبلكاش (طوب أبيض 25سم)",
    category: "مواد البناء",
    unit: "ألف طوبة",
    price: 950,
  },
  {
    name: "بلوك خرساني 20×20×40",
    category: "مواد البناء",
    unit: "ألف بلوك",
    price: 1300,
  },
  {
    name: "بلوك خرساني 15×20×40",
    category: "مواد البناء",
    unit: "ألف بلوك",
    price: 1100,
  },

  // Finishing Materials
  {
    name: "بلاط سيراميك 30×30",
    category: "التشطيب",
    unit: "م²",
    price: 80,
  },
  {
    name: "بلاط سيراميك 60×60",
    category: "التشطيب",
    unit: "م²",
    price: 120,
  },
  {
    name: "رخام مصري طبيعي",
    category: "التشطيب",
    unit: "م²",
    price: 250,
  },
  {
    name: "دهان داخلي (بلاستيك عادي)",
    category: "التشطيب",
    unit: "لتر",
    price: 45,
  },
  {
    name: "دهان خارجي (بلاستيك مقاوم)",
    category: "التشطيب",
    unit: "لتر",
    price: 65,
  },
  {
    name: "جبس بورد",
    category: "التشطيب",
    unit: "م²",
    price: 35,
  },

  // Wood & Carpentry
  {
    name: "خشب صنوبر 2.5×5",
    category: "الخشب",
    unit: "م³",
    price: 3500,
  },
  {
    name: "خشب زان 2.5×5",
    category: "الخشب",
    unit: "م³",
    price: 5500,
  },
  {
    name: "شمبر خشبي",
    category: "الخشب",
    unit: "م²",
    price: 85,
  },

  // Plumbing Materials
  {
    name: "ماسورة PVC 20 ملم",
    category: "السباكة",
    unit: "متر",
    price: 12,
  },
  {
    name: "ماسورة PVC 25 ملم",
    category: "السباكة",
    unit: "متر",
    price: 18,
  },
  {
    name: "ماسورة PVC 32 ملم",
    category: "السباكة",
    unit: "متر",
    price: 28,
  },
  {
    name: "ماسورة حديد مجلفن 1 بوصة",
    category: "السباكة",
    unit: "متر",
    price: 35,
  },

  // Electrical Materials
  {
    name: "أسلاك كهربائية 1.5 ملم",
    category: "الكهرباء",
    unit: "متر",
    price: 4,
  },
  {
    name: "أسلاك كهربائية 2.5 ملم",
    category: "الكهرباء",
    unit: "متر",
    price: 6,
  },
  {
    name: "أسلاك كهربائية 4 ملم",
    category: "الكهرباء",
    unit: "متر",
    price: 9,
  },
  {
    name: "أنابيب كهربائية واقية 20 ملم",
    category: "الكهرباء",
    unit: "متر",
    price: 8,
  },

  // Labor Rates
  {
    name: "عامل عام",
    category: "عمالة",
    unit: "يوم",
    price: 150,
  },
  {
    name: "نجار",
    category: "عمالة",
    unit: "يوم",
    price: 250,
  },
  {
    name: "عامل سباكة",
    category: "عمالة",
    unit: "يوم",
    price: 200,
  },
  {
    name: "عامل كهرباء",
    category: "عمالة",
    unit: "يوم",
    price: 200,
  },
  {
    name: "عامل دهانات",
    category: "عمالة",
    unit: "يوم",
    price: 180,
  },
  {
    name: "صنايعي (ماهر)",
    category: "عمالة",
    unit: "يوم",
    price: 400,
  },

  // Equipment Rental
  {
    name: "خلاط خرسانة",
    category: "معدات",
    unit: "يوم",
    price: 200,
  },
  {
    name: "رافعة شوكية",
    category: "معدات",
    unit: "يوم",
    price: 500,
  },
  {
    name: "هزاز خرسانة",
    category: "معدات",
    unit: "يوم",
    price: 100,
  },
  {
    name: "نشار كهربائي",
    category: "معدات",
    unit: "يوم",
    price: 80,
  },
  {
    name: "منصة عمل مؤقتة",
    category: "معدات",
    unit: "م²/يوم",
    price: 15,
  },
];

const GLOBAL_PRICES = [
  // Additional reference prices
  { name: "خرسانة جاهزة C25", category: "خرسانة", unit: "م³", price: 1850 },
  { name: "حديد تسليح Ø16", category: "حديد", unit: "طن", price: 27600 },
  { name: "أسمنت بورتلاند", category: "مواد إسمنتية", unit: "شيكارة", price: 185 },
  { name: "رمل نظيف", category: "مواد إسمنتية", unit: "م³", price: 280 },
  { name: "طوب أبيض", category: "مواد البناء", unit: "ألف طوبة", price: 950 },
  { name: "بلاط سيراميك", category: "التشطيب", unit: "م²", price: 100 },
  { name: "دهان داخلي", category: "التشطيب", unit: "لتر", price: 45 },
];

// ============================================================
// Helper functions
// ============================================================
async function insertData(table, records) {
  console.log(`\n📝 Inserting ${records.length} records into ${table}...`);

  for (const record of records) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) {
        const error = await response.json();
        // Ignore duplicate key errors
        if (error.code !== "23505") {
          console.warn(
            `⚠️  Failed to insert: ${record.name} - ${error.message}`
          );
        }
      } else {
        console.log(`✅ Inserted: ${record.name}`);
      }
    } catch (error) {
      console.error(`❌ Error inserting ${record.name}:`, error.message);
    }
  }
}

async function updateGlobalResources() {
  console.log(`\n🔄 Updating global_resources table...`);

  for (const resource of GLOBAL_RESOURCES) {
    try {
      // Try to find existing resource by name
      const searchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/global_resources?name=eq.${encodeURIComponent(resource.name)}&select=resource_id`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      const existing = await searchRes.json();

      if (existing && existing.length > 0) {
        // Update existing
        const resourceId = existing[0].resource_id;
        const updateRes = await fetch(
          `${SUPABASE_URL}/rest/v1/global_resources?resource_id=eq.${resourceId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              current_price: resource.price,
              category: resource.category,
              unit: resource.unit,
            }),
          }
        );

        if (updateRes.ok) {
          console.log(`✅ Updated: ${resource.name} → ${resource.price}`);
        } else {
          console.warn(`⚠️  Failed to update: ${resource.name}`);
        }
      } else {
        // Insert new
        const insertRes = await fetch(
          `${SUPABASE_URL}/rest/v1/global_resources`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              name: resource.name,
              category: resource.category,
              unit: resource.unit,
              current_price: resource.price,
            }),
          }
        );

        if (insertRes.ok) {
          console.log(`✅ Created: ${resource.name} → ${resource.price}`);
        } else {
          console.warn(`⚠️  Failed to create: ${resource.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${resource.name}:`, error.message);
    }
  }
}

// ============================================================
// Main execution
// ============================================================
async function main() {
  console.log("🚀 Starting price seed process...");
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

  try {
    // Test connection
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_KEY },
    });

    if (!testRes.ok) {
      throw new Error("Failed to connect to Supabase");
    }

    console.log("✅ Connected to Supabase");

    // Update global_resources with realistic prices
    await updateGlobalResources();

    // Insert into global_prices table
    await insertData("global_prices", GLOBAL_PRICES);

    console.log("\n✨ Seeding completed successfully!");
    console.log(`📊 Updated ${GLOBAL_RESOURCES.length} resources`);
    console.log(`📊 Added ${GLOBAL_PRICES.length} reference prices`);
  } catch (error) {
    console.error("\n❌ Error during seeding:", error.message);
    process.exit(1);
  }
}

main();
