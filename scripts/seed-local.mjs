#!/usr/bin/env node
// Fills a LOCAL Farm Agent database with sample store data so `pnpm dev` has
// something to show: a farm, products with stock and prices, two baskets,
// delivery zones and slots, and store settings. Everything is clearly sample
// data ("Sample …") and it refuses to run against anything but this computer.
//
// Usage: SEED_DATABASE_URL=postgresql://<owner>@127.0.0.1:54322/postgres pnpm local:seed
// Prints the farm id to put in SHOP_FARM_ID.
import pg from 'pg';

const url = process.env.SEED_DATABASE_URL;
if (!url) {
  console.error('Set SEED_DATABASE_URL to the local database (an owner role, not shop_runtime).');
  process.exit(1);
}
const host = new URL(url).hostname;
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
  console.error(`Refusing to seed ${host}: sample data goes only into a database on this computer.`);
  process.exit(1);
}

const FARM = process.env.SEED_FARM_ID ?? '5eed0000-0000-4000-8000-000000000001';
const ACTOR = '5eed0000-0000-4000-8000-000000000002';
const id = (n) => `5eed0000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('BEGIN');
  const exists = await client.query('SELECT 1 FROM "ShopSettings" WHERE "farmId"=$1', [FARM]);
  if (exists.rowCount) {
    console.log(`Sample store already seeded. SHOP_FARM_ID=${FARM}`);
    await client.query('ROLLBACK');
    process.exit(0);
  }
  await client.query(`INSERT INTO "Farm"(id,name,timezone,"updatedAt") VALUES ($1,'Sample farm','Asia/Beirut',now()) ON CONFLICT (id) DO NOTHING`, [FARM]);
  await client.query(`INSERT INTO "UserProfile"(id,name,"updatedAt") VALUES ($1,'Sample data',now()) ON CONFLICT (id) DO NOTHING`, [ACTOR]);
  await client.query(`INSERT INTO "InventoryLocation"(id,"farmId",name,"createdBy") VALUES ($1,$2,'Sample store room',$3)`, [id(10), FARM, ACTOR]);

  // Menu: [n, slug, English, Arabic, parent n, highlight]
  const categories = [
    [80, 'fruits-vegetables', 'Fruits & Vegetables', 'خضار وفاكهة', null, false],
    [81, 'vegetables', 'Fresh vegetables', 'خضار طازجة', 80, false],
    [82, 'fruits', 'Fresh fruits', 'فاكهة طازجة', 80, false],
    [83, 'mouneh', 'Mouneh', 'مونة', null, false],
    [84, 'olive-oil', 'Olive oil', 'زيت الزيتون', 83, false],
    [85, 'preserves', 'Preserves & herbs', 'مربّيات وأعشاب', 83, false],
    [86, 'eggs-dairy', 'Eggs', 'بيض', null, false],
    [87, 'offers', 'Offers %', 'العروض ٪', null, true],
  ];
  for (const [n, slug, name, ar, parent, highlight] of categories) {
    await client.query(`INSERT INTO "ShopCategory"(id,"farmId",slug,"nameEn","nameAr","parentId",highlight,"sortOrder") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id(n), FARM, slug, name, ar, parent ? id(parent) : null, highlight, n]);
  }

  // [n, product name, Arabic, base unit, package name, package Arabic, package size, stock in base unit, price, lot year, category n, featured]
  const items = [
    [20, 'Olive oil', 'زيت زيتون', 'kg', '1 L bottle', 'قنينة ١ ليتر', 0.92, 46, '14.00', 2025, 84, true],
    [21, 'Tomatoes', 'بندورة', 'kg', null, null, null, 60, '1.75', 2026, 81, true],
    [22, 'Cucumbers', 'خيار', 'kg', null, null, null, 40, '1.50', 2026, 81, false],
    [23, 'Zaatar', 'زعتر', 'kg', '250 g jar', 'مرطبان ٢٥٠ غ', 0.25, 3, '6.00', 2026, 85, true],
    [24, 'Figs', 'تين', 'kg', '1 kg box', 'علبة ١ كغ', 1, 0, '5.00', 2026, 82, false],
    [25, 'Grapes', 'عنب', 'kg', null, null, null, 25, '3.00', 2026, 82, true],
    [26, 'Eggplant', 'باذنجان', 'kg', null, null, null, 30, '1.25', 2026, 81, false],
    [27, 'Fig jam', 'مربّى التين', 'kg', '400 g jar', 'مرطبان ٤٠٠ غ', 0.4, 6, '7.50', 2026, 85, true],
    [28, 'Free-range eggs', 'بيض بلدي', 'unit', '30 eggs', '٣٠ بيضة', 30, 300, '9.00', 2026, 86, true],
    [29, 'Pomegranates', 'رمّان', 'kg', null, null, null, 18, '2.50', 2026, 82, true],
  ];
  for (const [n, name, ar, unit, pack, packAr, size, stock, price, year, category, featured] of items) {
    const product = id(n), item = id(n + 100), lot = id(n + 200), pkg = pack ? id(n + 300) : null;
    await client.query(`INSERT INTO "MasterRecord"(id,"farmId",kind,name,"nameAr","createdBy","updatedAt") VALUES ($1,$2,'product',$3,$4,$5,now())`, [product, FARM, name, ar, ACTOR]);
    await client.query(`INSERT INTO "InventoryItem"(id,"farmId","productId","baseUnit") VALUES ($1,$2,$3,$4)`, [item, FARM, product, unit]);
    if (pkg) await client.query(`INSERT INTO "InventoryPackage"(id,"farmId","itemId",name,"nameAr","baseQuantity") VALUES ($1,$2,$3,$4,$5,$6)`, [pkg, FARM, item, pack, packAr, size]);
    await client.query(`INSERT INTO "InventoryLot"(id,"farmId","itemId","locationId",code,"productionYear") VALUES ($1,$2,$3,$4,$5,$6)`, [lot, FARM, item, id(10), `SAMPLE-${n}`, year]);
    if (stock > 0) {
      await client.query(
        `INSERT INTO "InventoryMovement"(id,"farmId","lotId","itemId","occurredOn",kind,"enteredQuantity","unitKind","unitNameSnapshot","conversionBaseSnapshot","quantityBase",notes,"sourceKey","actorId")
         VALUES (gen_random_uuid(),$1,$2,$3,current_date,'opening',$4,'base',$5,1,$4,'Sample data','sample:opening',$6)`,
        [FARM, lot, item, stock, unit, ACTOR],
      );
    }
    await client.query(`INSERT INTO "ProductPrice"(id,"farmId","itemId","packageId","productionYear","unitPriceUsd","updatedBy","updatedAt") VALUES (gen_random_uuid(),$1,$2,$3,NULL,$4,$5,now())`, [FARM, item, pkg, price, ACTOR]);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + (pack ? '-' + pack.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') : '');
    await client.query(
      `INSERT INTO "ShopProduct"(id,"farmId","itemId","packageId",slug,"nameEn","nameAr","descriptionEn","descriptionAr",published,"sortOrder","categoryId",featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12)`,
      [id(n + 400), FARM, item, pkg, slug, name, ar, `Sample description for ${name.toLowerCase()}.`, `وصف تجريبي لـ${ar}.`, n, id(category), featured],
    );
  }

  await client.query(`INSERT INTO "ShopSettings"("farmId","paymentMethods","whatsappPhone","wishAccount","omtAccount") VALUES ($1,ARRAY['cod','wish','omt','whatsapp'],'+961 70 000 000','[Wish account]','[OMT account]')`, [FARM]);
  const zones = [[50, 'Beirut', 'بيروت', '4.00', '15.00'], [51, 'Jounieh', 'جونية', '3.00', '10.00'], [52, 'Batroun', 'البترون', '2.00', '0']];
  for (const [n, name, ar, fee, min] of zones) {
    await client.query(`INSERT INTO "ShopDeliveryZone"(id,"farmId","nameEn","nameAr","feeUsd","minOrderUsd","sortOrder") VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id(n), FARM, name, ar, fee, min, n]);
    // Thursday and Saturday mornings, Saturday afternoon; orders close 24 h before.
    for (const [weekday, start, end, capacity] of [[4, '10:00', '13:00', 8], [6, '10:00', '13:00', 12], [6, '15:00', '18:00', 3]]) {
      await client.query(`INSERT INTO "ShopDeliverySlot"(id,"farmId","zoneId",weekday,"startTime","endTime","cutoffHours",capacity) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,24,$6)`, [FARM, id(n), weekday, start, end, capacity]);
    }
  }

  const baskets = [
    [60, 'small-basket', 'Small basket', 'السلّة الصغيرة', 'For one or two: the week’s vegetables.', 'لشخص أو شخصين: خضار الأسبوع.', '18.00', [[121, null, 1.5], [122, null, 1]]],
    [61, 'family-basket', 'Family basket', 'سلّة العائلة', 'Vegetables for a full family week, with a bottle of our olive oil.', 'خضار لأسبوع كامل للعائلة، مع قنينة من زيت الزيتون.', '35.00', [[121, null, 3], [122, null, 2], [120, 320, 1]]],
  ];
  for (const [n, slug, name, ar, desc, descAr, price, contents] of baskets) {
    await client.query(`INSERT INTO "ShopBasketPlan"(id,"farmId",slug,"nameEn","nameAr","descriptionEn","descriptionAr","priceUsd",published,"sortOrder") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9)`, [id(n), FARM, slug, name, ar, desc, descAr, price, n]);
    for (const [i, [item, pkg, qty]] of contents.entries()) {
      await client.query(`INSERT INTO "ShopBasketPlanItem"(id,"farmId","planId","itemId","packageId",quantity,"sortOrder") VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6)`, [FARM, id(n), id(item), pkg ? id(pkg) : null, qty, i]);
    }
  }
  await client.query('COMMIT');
  console.log(`Sample store seeded. SHOP_FARM_ID=${FARM}`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
