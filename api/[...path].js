import admin from 'firebase-admin';

// 1. تشغيل الفايربيس أدمن بأمان ومعالجة كسر السطور في المفتاح السري
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      })
    });
  } catch (initError) {
    console.error("Firebase initialization failed:", initError);
  }
}

const db = admin.firestore();

// 2. الدالة الرئيسية الديناميكية للتعامل مع Vercel
export default async function handler(req, res) {
  // تفعيل الـ CORS لتجنب مشاكل الحظر بين النطاقات
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // استخراج المسار بعد /api/
    // مثال: /api/dynamic/sales_quotations أو /api/employees/EMP-123
    const { path } = req.query; 
    if (!path || path.length === 0) {
      return res.status(400).json({ error: "المسار غير صحيح" });
    }

    // تنظيف المسار وحذف كلمة "dynamic" أو "v1" إذا كانت موجودة في البداية
    let segments = Array.isArray(path) ? path : path.split('/');
    if (segments[0] === 'dynamic' || segments[0] === 'v1') {
      segments.shift();
    }

    const collectionName = segments[0]; // اسم الجدول (مثل sales_quotations)
    const docId = segments[1];          // معرف المستند إن وجد (مثل EMP-123)

    if (!collectionName) {
      return res.status(400).json({ error: "اسم الـ Collection غير محدد" });
    }

    const collectionRef = db.collection(collectionName);

    // 3. معالجة العمليات الأربعة (CRUD) ديناميكياً حسب نوع الـ Request
    switch (req.method) {
      
      // --- جلب البيانات ---
      case 'GET':
        if (docId) {
          const docSnapshot = await collectionRef.doc(docId).get();
          if (!docSnapshot.exists) {
            return res.status(404).json({ error: "المستند غير موجود" });
          }
          return res.status(200).json({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          const querySnapshot = await collectionRef.get();
          const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          return res.status(200).json(documents);
        }

      // --- إضافة بيانات جديدة ---
      case 'POST':
        const newData = req.body;
        if (docId || newData.id) {
          const targetId = docId || newData.id;
          const cleanData = { ...newData };
          delete cleanData.id; // تجنب تكرار الحقل داخل البيانات
          await collectionRef.doc(targetId).set(cleanData, { merge: true });
          return res.status(201).json({ id: targetId, ...cleanData });
        } else {
          const docRef = await collectionRef.add(newData);
          return res.status(201).json({ id: docRef.id, ...newData });
        }

      // --- تعديل بيانات مستند ---
      case 'PUT':
      case 'PATCH':
        if (!docId) {
          return res.status(400).json({ error: "يجب تحديد ID المستند لتعديله" });
        }
        const updateData = req.body;
        delete updateData.id;
        await collectionRef.doc(docId).set(updateData, { merge: true });
        return res.status(200).json({ id: docId, ...updateData });

      // --- حذف مستند ---
      case 'DELETE':
        if (!docId) {
          return res.status(400).json({ error: "يجب تحديد ID المستند لحذفه" });
        }
        await collectionRef.doc(docId).delete();
        return res.status(200).json({ id: docId, message: "تم الحذف بنجاح" });

      default:
        return res.status(405).json({ error: "العملية غير مدعومة" });
    }

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "انهيار داخلي في السيرفر", 
      message: error.message 
    });
  }
}