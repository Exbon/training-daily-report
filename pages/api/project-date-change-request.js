const mssql = require("mssql");
const dbserver = require("../../dbConfig.js");

const projectDateChangeRequestHandler = (req, res) => {
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

          const query = `EXEC [Training].[dbo].[ProjectDateChangeRequest_Insert]
          ${body.EmployeeID}, ${body.ProjectID}, "${body.RequestType}", ${body.RequestID}, '${body.StartDate}', '${body.EndDate}', '${body.Reason}'`;
          /* --Params--
          	@employeeID int,
            @projectID int,
            @requestType nvarchar(50),
            @requestID int,
            @startDate date,
            @endDate date,
            @reason    nvarhcar(1000)
          */

          request.query(query, (err, recordset) => {
            if (err) {
              console.error(err);
              return resolve();
            }
            res.status(200).json({
              message: "Success, the request has been submitted.",
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

export default projectDateChangeRequestHandler;
