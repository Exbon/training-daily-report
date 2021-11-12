const mssql = require("mssql");
const dbserver = require("../../dbConfig.js");

const logDailyReportsHandler = (req, res) => {
  const { method, body } = req;
  return new Promise(resolve => {
    switch (method) {
      case "POST":
        mssql.connect(dbserver.dbConfig, err => {
          if (err) {
            console.error(err);
            return resolve();
          }
          const request = new mssql.Request();

          const query = `EXEC [Training].[dbo].[LogDailyReport_Insert]
          ${body.EmployeeID}, ${body.ProjectID}, "${body.Date}", "${body.Category}", "${body.Action}"`;
          /* --Params--
          	@employeeID int,
            @projectID int,
            @date date,
            @category nvarchar(50),
            @action nvarchar(50)
          */

          request.query(query, (err, recordset) => {
            if (err) {
              console.error(err);
              return resolve();
            }
            res.status(200).json({
              message: "Success, the log has been created.",
            });
            return resolve();
          });
        });
        break;

      default:
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
        res.status(404).end(`Failed`);
        resolve();
    }
  });
};

export default logDailyReportsHandler;
