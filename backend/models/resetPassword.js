const resetStore = new Map();
const verifiedEmails = new Set();

// guardar código
const saveCode = (email, code) => {
  resetStore.set(email, {
    code,
    expire: Date.now() + 10 * 60 * 1000 // 10 minutos
  });
};

// verificar código
const verifyCod = (email, code) => {
  const data = resetStore.get(email);

  if (!data) return false;

  // verificar expiración
  if (Date.now() > data.expire) {
    resetStore.delete(email);
    return false;
  }

  // verificar código
  if (data.code !== code) return false;

  // marcar como verificado
  verifiedEmails.add(email);

  return true;
};

// verificar si ya validó código
const isVerified = (email) => {
  return verifiedEmails.has(email);
};

// limpiar datos después de usar
const clearData = (email) => {
  resetStore.delete(email);
  verifiedEmails.delete(email);
};

module.exports = {
  saveCode,
  verifyCod,
  isVerified,
  clearData
};