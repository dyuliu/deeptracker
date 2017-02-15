Col.aggregate([
  { $match: { 'wid': +req.wid } },
  { $project: projectObj },
  { $sort: { 'iter': 1 } }
], (err, data) => {
  console.log(chalk.green('fetch layerAttr successfully'), data.length);
  res.json(data);
});