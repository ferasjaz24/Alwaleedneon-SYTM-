import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  /onSave=\{\(username, perms\) => \{\s*handleUpdateUser\(username, \{ permissions: perms \}\);\s*\}\}/,
  `onSave={(username, payload) => {
                   const { newUsername, password, ...rest } = payload as any;
                   handleUpdateUser(username, { 
                     ...(newUsername && { newUsername }),
                     ...(password && { password }),
                     permissions: rest 
                   });
                 }}`
);
app = app.replace(
  /const handleUpdateUser = async \(username: string, updatedFields: any\) => \{[\s\S]*?try \{/,
  `const handleUpdateUser = async (username: string, updatedFields: any) => {
    try {`
);
app = app.replace(
  `      if (res.ok) {
        handleReloadUsers();
      }`,
  `      if (res.ok) {
        handleReloadUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "تحديث فاشل");
      }`
);

fs.writeFileSync('src/App.tsx', app, 'utf8');

let modal = fs.readFileSync('src/components/UserPermissionsModal.tsx', 'utf8');
modal = modal.replace(
  `onSave: (username: string, permissions: UserPermissions) => void;`,
  `onSave: (username: string, payload: UserPermissions & { newUsername?: string, password?: string }) => void;`
);
fs.writeFileSync('src/components/UserPermissionsModal.tsx', modal, 'utf8');

console.log('Fixed typings');
