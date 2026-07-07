fetch('http://127.0.0.1:3000/api/dynamic/bank_accounts').then(res=>res.json()).then(data=>console.log(data)).catch(console.error);
