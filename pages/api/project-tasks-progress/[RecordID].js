const mssql = require("mssql");
const dbserver = require("../../../dbConfig.js");

const RecordIDHandler = (req, res) => {
  const {
    query: { RecordID },
    body,
    method,
  } = req;

  return new Promise(resolve => {
    switch (method) {
      case "PUT":
        mssql.connect(dbserver.dbConfig, err => {
          if (err) {
            console.error(err);
            return resolve();
          }
          const request = new mssql.Request();

          const query = `EXEC [Training].[dbo].[ProjectTaskProgress_Update]
            ${RecordID}, ${body.WorkCompleted}`;
          /* --Params--
            @recordID int,
	        @workCompleted float
          */

          request.query(query, (err, recordset) => {
            if (err) {
              console.error(err);
              return resolve();
            }

            res.status(200).json({
              message: "Success, the record of task progress has been updated.",
            });
            return resolve();
          });
        });
        break;

      default:
        res.setHeader("Allow", ["PUT"]);
        res.status(405).end(`Method ${method} Not Allowed`);
        res.status(500).end("This is an error");
        return resolve();
    }
  });
};

export default RecordIDHandler;
