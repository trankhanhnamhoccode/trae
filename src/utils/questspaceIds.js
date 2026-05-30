const nextPrefixedId = async (Model, prefix, width = 2) => {
  const docs = await Model.find({ id: new RegExp(`^${prefix}_\\d+$`) }).select('id');
  let max = 0;

  for (const doc of docs) {
    const n = Number.parseInt(String(doc.id).split('_')[1], 10);
    if (Number.isFinite(n) && n > max) {
      max = n;
    }
  }

  return `${prefix}_${String(max + 1).padStart(width, '0')}`;
};

module.exports = {
  nextPrefixedId
};
