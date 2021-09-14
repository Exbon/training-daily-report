const mssql = require("mssql");
const dbserver = require("../../../dbConfig.js");

const calculateHoursHandler = (req, res) => {
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

          const query = `EXEC [Hammer].[dbo].[CalculateHours]
          '${body.StartDate}',
          '${body.EndDate}',
          ${body.ProjectID},
          ${body.EmployeeID}
          `;

          /* --Params--
          @startDate date = '1970-01-01', 
          @endDate date = '1970-01-01', 
          @projectID int = 0,
          @employeeID int = 0,
          */

          request.query(query, (err, recordset) => {
            if (err) {
              console.error(err);
              return resolve();
            }
            res.status(200).json({
              message: "Success, the timesheet has been created.",
              result: recordset,
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

export default calculateHoursHandler;
