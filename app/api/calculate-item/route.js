import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. مصفوفة تحويل الوحدات (Unit Conversion Matrix)
function normalizePrice(price, globalUnit, recipeUnit) {
  if (!globalUnit || !recipeUnit) return price;
  
  const gUnit = globalUnit.trim().replace('²', '2').replace('³', '3');
  const rUnit = recipeUnit.trim().replace('²', '2').replace('³', '3');

  if (gUnit === rUnit) return price;

  // تحويلات الطوب
  if (gUnit === 'ألف طوبة' && rUnit === 'طوبه') return price / 1000;
  if (gUnit === 'ألف طوبة' && rUnit === 'طوبة') return price / 1000;

  // تحويلات الأوزان
  if (gUnit === 'شيكارة 50كج' && rUnit === 'طن') return price * 20;
  if (gUnit === 'شيكارة 50كج' && rUnit === 'كجم') return price / 50;
  if (gUnit === 'طن' && rUnit === 'كجم') return price / 1000;
  if (gUnit === 'كجم' && rUnit === 'طن') return price * 1000;

  // تحويلات الأبعاد
  if (gUnit === 'م2' && rUnit === 'م3') return price / 4; 
  if (gUnit === 'م3' && rUnit === 'م2') return price / 10; 
  if (gUnit === 'لتر' && rUnit === 'م3') return price * 1000;

  // تحويلات السوائل
  if (gUnit === 'لتر' && rUnit === 'م3') return price * 1000;
  if (gUnit === 'م3' && rUnit === 'لتر') return price / 1000;

  // تحويلات المساحات الصغيرة (سم مربع)
  if (gUnit === 'م2' && rUnit === 'سم2') return price / 10000;
  if (gUnit === 'سم2' && rUnit === 'م2') return price * 10000;

  // تحويلات الحجوم الصغيرة (سم مكعب)
  if (gUnit === 'م3' && rUnit === 'سم3') return price / 1000000;
  if (gUnit === 'سم3' && rUnit === 'م3') return price * 1000000;

  // تحويلات العمالة
  if ((gUnit === 'يوميه' || gUnit === 'يومية') && rUnit === 'ساعة') return price / 8;
  if (gUnit === 'ساعة' && (rUnit === 'يوميه' || rUnit === 'يومية')) return price * 8;

  return price;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { recipe_id } = body;

    if (!recipe_id) {
      return NextResponse.json({ success: false, error: 'Missing recipe_id' }, { status: 400 });
    }

    // 2. الاتصال بقاعدة بيانات Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. جلب بيانات الوصفة (البند)
    const { data: recipeRow, error: recipeError } = await supabase
      .from('reference_boq')
      .select('*')
      .eq('id', recipe_id)
      .single();

    if (recipeError || !recipeRow) {
      throw new Error("لم يتم العثور على البند في قاعدة البيانات");
    }

    const recipe = typeof recipeRow.recipe === 'string' ? JSON.parse(recipeRow.recipe) : recipeRow.recipe;

    // 4. جلب أسعار السوق الحية
    const { data: globalPricesData, error: pricesError } = await supabase
      .from('global_prices')
      .select('*');

    if (pricesError) {
      throw new Error("حدث خطأ أثناء جلب أسعار السوق");
    }

    // 5. معالجة الخامات
    const processedMaterials = (recipe.materials || []).map(item => {
      const globalItem = globalPricesData.find(g => g.name === item.desc);
      let rawPrice = globalItem ? globalItem.price : (item.ref_price_snapshot || 0);
      let globalUnit = globalItem ? globalItem.unit : item.unit;
      
      const normalizedPrice = normalizePrice(rawPrice, globalUnit, item.unit);
      
      const baseQuantity = item.qty || item.qty_per_unit || 0;
      const wasteFactor = item.waste_factor || 1;
      const actualQuantity = baseQuantity * wasteFactor;
      const totalItemCost = actualQuantity * normalizedPrice;

      return { ...item, base_quantity: baseQuantity, waste_factor: wasteFactor, actual_quantity: actualQuantity, normalized_unit_price: normalizedPrice, global_unit_matched: globalUnit, total_item_cost: totalItemCost };
    });

    // 6. معالجة العمالة
    const processedLabor = (recipe.labor || []).map(item => {
      const globalItem = globalPricesData.find(g => g.name === item.desc);
      let rawPrice = globalItem ? globalItem.price : (item.ref_daily_cost_snapshot || 0);
      let globalUnit = globalItem ? globalItem.unit : item.unit;
      
      const normalizedPrice = normalizePrice(rawPrice, globalUnit, item.unit);
      
      const baseQuantity = item.qty_per_unit || item.qty || 0;
      const wasteFactor = item.waste_factor || 1;
      const actualQuantity = baseQuantity * wasteFactor;
      const totalItemCost = actualQuantity * normalizedPrice;

      return { ...item, base_quantity: baseQuantity, waste_factor: wasteFactor, actual_quantity: actualQuantity, normalized_unit_price: normalizedPrice, global_unit_matched: globalUnit, total_item_cost: totalItemCost };
    });

    // 7. معالجة المعدات
    const processedEquipment = (recipe.equipment || []).map(item => {
      const globalItem = globalPricesData.find(g => g.name === item.desc);
      let rawPrice = globalItem ? globalItem.price : (item.ref_daily_cost_snapshot || 0);
      let globalUnit = globalItem ? globalItem.unit : item.unit;
      
      const normalizedPrice = normalizePrice(rawPrice, globalUnit, item.unit);
      
      const baseQuantity = item.qty_per_unit || item.qty || 0;
      const wasteFactor = item.waste_factor || 1;
      const actualQuantity = baseQuantity * wasteFactor;
      const totalItemCost = actualQuantity * normalizedPrice;

      return { ...item, base_quantity: baseQuantity, waste_factor: wasteFactor, actual_quantity: actualQuantity, normalized_unit_price: normalizedPrice, global_unit_matched: globalUnit, total_item_cost: totalItemCost };
    });

    // 8. تجميع الإجماليات
    const totalMaterialsCost = processedMaterials.reduce((sum, item) => sum + item.total_item_cost, 0);
    const totalLaborCost = processedLabor.reduce((sum, item) => sum + item.total_item_cost, 0);
    const totalEquipmentCost = processedEquipment.reduce((sum, item) => sum + item.total_item_cost, 0);
    
    const totalDirectCost = totalMaterialsCost + totalLaborCost + totalEquipmentCost;

    // 9. إرجاع النتيجة
    return NextResponse.json({
      success: true,
      data: {
        recipe_id: recipeRow.id,
        item_description: recipeRow.description,
        total_direct_cost: totalDirectCost,
        breakdown: {
          materials: processedMaterials,
          labor: processedLabor,
          equipment: processedEquipment
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
