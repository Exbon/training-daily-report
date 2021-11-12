const mssql = require("mssql");
const dbserver = require("../../dbConfig.js");

const timesheetItemHandler = (req, res) => {
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

          const query = `EXEC [Training].[dbo].[TimesheetItems_Insert]
          ${body.TimesheetID},
          ${body.TaskID},
          '${body.Start}',
          '${body.End}',
          ${body.ProjectID},
          '${body.LaborHours}'`;

          /* --Params--
          @timesheetID int,
          @taskID int,
          @start time(0),
          @end time(0),
          @projectID int,
          @laborHours float
          */

          request.query(query, (err, recordset) => {
            if (err) {
              console.error(err);
              return resolve();
            }
            res.status(200).json({
              message: "Success, the timesheet item has been created.",
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

export default timesheetItemHandler;
