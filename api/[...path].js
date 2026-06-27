import admin from 'firebase-admin';

// تشغيل الفايربيس أدمن عن طريق قراءة ملف الـ JSON الكامل من متغيرات البيئة
if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("متغير البيئة FIREBASE_SERVICE_ACCOUNT غير مضاف في Vercel");
    }
    
    // تحويل النص السري إلى كائن JSON مرمز
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("تم الاتصال بفايربيس بنجاح!");
  } catch (initError) {
    console.error("فشل تشغيل الفايربيس:", initError.message);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // تفعيل الـ CORS لتجنب حظر الطلبات
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { path } = req.query; 
    if (!path) {
      return res.status(400).json({ error: "المسار فارغ" });
    }

    // تقسيم المسار وتنظيفه من الكلمات الزائدة ديناميكياً
    let segments = Array.isArray(path) ? path : path.split('/');
    if (segments[0] === 'dynamic' || segments[0] === 'v1') {
      segments.shift();
    }

    const collectionName = segments[0]; // اسم الجدول بالفايربيس
    const docId = segments[1];          // معرف المستند (إن وجد)

    if (!collectionName) {
      return res.status(400).json({ error: "لم يتم تحديد اسم الـ Collection" });
    }

    const collectionRef = db.collection(collectionName);

    // معالجة العمليات الأربعة بالحذف والإضافة والتعديل والجلب
    switch (req.method) {
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

      case 'POST':
        const newData = req.body || {};
        if (docId || newData.id) {
          const targetId = docId || newData.id;
          const cleanData = { ...newData };
          delete cleanData.id;
          await collectionRef.doc(targetId).set(cleanData, { merge: true });
          return res.status(201).json({ id: targetId, ...cleanData });
        } else {
          const docRef = await collectionRef.add(newData);
          return res.status(201).json({ id: docRef.id, ...newData });
        }

      case 'PUT':
      case 'PATCH':
        if (!docId) {
          return res.status(400).json({ error: "يجب تمرير ID للتعديل" });
        }
        const updateData = req.body || {};
        delete updateData.id;
        await collectionRef.doc(docId).set(updateData, { merge: true });
        return res.status(200).json({ id: docId, ...updateData });

      case 'DELETE':
        if (!docId) {
          return res.status(400).json({ error: "يجب تمرير ID للحذف" });
        }
        await collectionRef.doc(docId).delete();
        return res.status(200).json({ id: docId, message: "تم الحذف بنجاح" });

      default:
        return res.status(405).json({ error: "العملية غير مدعومة" });
    }

  } catch (error) {
    console.error("خطأ بالسيرفر الداخلي:", error);
    return res.status(500).json({ 
      error: "انهيار في معالجة البيانات", 
      message: error.message 
    });
  }
}