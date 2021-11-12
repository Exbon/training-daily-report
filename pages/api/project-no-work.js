const mssql = require("mssql");
const dbserver = require("../../dbConfig.js");

const projectNoWorkHandler = (req, res) => {
  const { method, body } = req;
  return new Promise(resolve => {
    switch (method) {
      case "GET":
        mssql.connect(dbserver.dbConfig, err => {
          if (err) {
            console.error(err);
            return resolve();
          }
          const request = new mssql.Request();

          const projectID = req.query.projectID;

          const query = `EXEC [Training].[dbo].[ProjectNoWork_SelectByProjectID]
          ${projectID} `;

          request.query(query, (err, recordset) => {
            if (err) {
              console.error(err);
              return resolve();
            }
            const response = recordset.recordset;
            res.status(200).json(response);
            return resolve();
          });
        });
        break;

      default:
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${method} Not Allowed`);
        res.status(404).end(`Failed`);
        resolve();
    }
  });
};

export default projectNoWorkHandler;
