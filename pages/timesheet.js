import { useState, useMemo, useEffect } from "react";
import axios from "axios";

import {
  useTable,
  useBlockLayout,
  useGroupBy,
  useExpanded,
  useSortBy,
} from "react-table";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider, DatePicker } from "@material-ui/pickers";
import inputTime from "../components/main/inputTime";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/Save";
import InputMask from "react-input-mask";
import { formatDate } from "../components/main/formatDate";
import styles from "./Timesheet.module.css";
import classNames from "classnames/bind";
import { usePromiseTracker, trackPromise } from "react-promise-tracker";
import Loader from "react-loader-spinner";
import Head from "next/head";

import MainTab from "../components/MainTab/MainTab";

import { CookiesProvider, useCookies } from "react-cookie";
import Login from "../components/MainTab/login.js";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Router, { useRouter } from "next/router";
import NotPermission from "../components/MainTab/NotPermission";

import AddIcon from "@material-ui/icons/Add";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

import Autocomplete from "react-autocomplete";

import AddCircleIcon from "@material-ui/icons/AddCircle";

import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

import moment from "moment";
import Modal from "react-modal";

import { useMediaQuery } from "react-responsive";

toast.configure();
let afterSundayCheck = true;
let dataEmployees = [];
let dataTasks = [];
let dataLatest = [];
let id = -1000000;

const convertInputToTime = time => {
  let match = inputTime.filter(data => data.input === time);
  if (match[0] === undefined) {
    return "error";
  }
  return match[0].time;
};

const Timesheet = () => {
  const resolution712 = useMediaQuery({
    maxWidth: "712px",
  });

  const router = useRouter();
  const [projectState, setProjectState] = useState(undefined);
  const [checkDisableAddEmployeeButton, setCheckDisableAddEmployeeButton] =
    useState(false);
  const [stateAssignedProject, setStateAssignedProject] = useState([
    { ProjectID: 0 },
  ]);
  const [stateNoAssigned, setStateNoAssigned] = useState([]);
  const [checkState, setCheckState] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies();
  const [status, setStatus] = useState({
    cookies: {
      username: 0,
      password: 0,
      fullname: "",
      employeeid: 0,
    },
    permission: true,
  });

  const getSunday = d => {
    d = new Date(d);
    let day = d.getDay(),
      diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getMonday = d => {
    d = new Date(d);
    var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const date_diff_indays = (date1, date2) => {
    return Math.floor(
      (Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()) -
        Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())) /
        (1000 * 60 * 60 * 24)
    );
  };

  const dateCheckEditable = str => {
    const toStr = str.toLocaleString();
    const newStr =
      toStr.split("/")[0] +
      "/" +
      toStr.split("/")[1] +
      "/" +
      toStr.split("/")[2].slice(0, 4);
    const dateFromStr = new Date(newStr);
    const sundayOfSelected = getMonday(dateFromStr);
    const sundayOfToday = getMonday(now);
    if (date_diff_indays(sundayOfToday, sundayOfSelected) >= 0) {
      afterSundayCheck = true;
      return true;
    } else {
      //Turning on the lockout
      afterSundayCheck = false;
      return false;

      //Turning off the lockout
      // afterSundayCheck = true;
      // return true;
    }
  };

  const [data, setData] = useState(() => []);
  const [data2, setData2] = useState(() => {
    init: "first";
  });
  const [dataTable, setDataTable] = useState(() => [
    {
      Id: id++,
      EmployeeID: 0,
      EmployeeName: "",
      TaskID: -1,
      StartTime: "07:00AM",
      EndTime: "04:00PM",
    },
  ]);
  const [dataLaborHours, setDataLaborHours] = useState(() => []);
  const [dataView, setDataView] = useState(() => []);
  const [dataView2, setDataView2] = useState(() => {
    init: "first";
  });
  const [selectedInputEmployee, setSelectedInputEmployee] = useState(() => 0);
  const [selectedSummaryEmployee, setSelectedSummaryEmployee] = useState(
    () => 0
  );

  const convertTaskNameToID = name => {
    let task = dataTasks.find(task => name === task.Name);
    if (task) {
      return task.TaskID;
    } else {
      return 0;
    }
  };

  const convertEmployeeNameToID = name => {
    let employee = dataEmployees.find(
      employee => name === employee.EmployeeName
    );
    if (employee) {
      return employee.EmployeeID;
    } else {
      return 0;
    }
  };

  const now = new Date().toLocaleString({
    timeZone: "America/Los_Angeles",
  });

  const [selectedDate, setSelectedDate] = useState(now);

  const handleDateChange = date => {
    setSelectedDate(date);
  };

  useEffect(() => {
    let promises = [];
    if (!router.isReady) return;

    const fetchData = async () => {
      if (status.cookies.username !== 0) {
        if (status.cookies.username !== undefined) {
          axios({
            method: "post",
            url: `/api/daily-report/signin`,
            timeout: 5000, // 2 seconds timeout
            headers: {},
            data: {
              Username: status.cookies.username,
              Password: status.cookies.password,
            },
          })
            .then(response => {
              const assignedProject = response.data.result.recordsets[1];
              setStateAssignedProject(response.data.result.recordsets[1]);
              if (
                response.data.result.recordsets[1].length > 0 &&
                projectState === undefined
              ) {
                if (router.query.pid) {
                  setProjectState(router.query.pid);
                } else {
                  setProjectState(
                    "" + response.data.result.recordsets[1][0].ProjectID
                  );
                }
              }

              if (status.permission === true && projectState !== undefined) {
                let check = 0;
                for (let i = 0; i < assignedProject.length; i++) {
                  if (
                    assignedProject[i].ProjectID.toString() === projectState
                  ) {
                    check++;
                    break;
                  }
                }
                if (check === 0) {
                  setStatus(prevState => ({
                    ...prevState,
                    permission: false,
                  }));
                }
              }
            })
            .catch(err => {
              alert(
                "Loading Error.(POST /api/daily-report/signin) \n\nPlease try again.\n\nPlease contact IT if the issue still persists. (Hyunmyung Kim 201-554-6666)\n\n" +
                  err
              );
            });
        }
      } else {
        setStatus(prevState => ({
          ...prevState,
          cookies: {
            username: cookies.username,
            password: cookies.password,
            fullname: cookies.fullname,
            employeeid: cookies.employeeid,
          },
        }));
      }

      if (
        status.permission === true &&
        projectState !== undefined &&
        selectedDate !== undefined
      ) {
        router.push(`?pid=${projectState}`);
        await axios({
          method: "get",
          url: `/api/timesheets?selectedDate=${formatDate(
            selectedDate
          )}&projectID=${projectState}`,
          timeout: 5000, // 5 seconds timeout
          headers: {},
        }).then(result => {
          setData(result.data.result[0]);
          setDataTable([
            {
              Id: id++,
              EmployeeID: 0,
              EmployeeName: "",
              TaskID: -1,
              StartTime: "07:00AM",
              EndTime: "04:00PM",
            },
          ]);
          dataEmployees = result.data.result[1];
          dataTasks = result.data.result[2];
          dataLatest = result.data.result[3];
          setSelectedSummaryEmployee(0);
          setSelectedInputEmployee(0);
        });
      }
    };
    promises.push(fetchData());
    trackPromise(Promise.all(promises).then(() => {}));
  }, [projectState, status, selectedDate, router.isReady]);

  function compare(a, b) {
    if (a.EmployeeID < b.EmployeeID) {
      return -1;
    }
    if (a.EmployeeID > b.EmployeeID) {
      return 1;
    }
    return 0;
  }

  const handleSaveTimesheetBtn = async () => {
    let promises = [];
    let param_CalculateHours = [];

    let checkEmployeeName = data.find(element => element.EmployeeID == 0);
    let checkTaskName = data.find(element => element.TaskID == 0);

    if (checkEmployeeName) {
      checkSave += 1;
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to save. <br /> Please check <strong>Employee Name </strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    } else if (checkTaskName) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to save. <br /> Please check <strong>Task Name </strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    } else {
      const fetchData = async () => {
        let tempDataView = dataView.sort(compare);

        await axios({
          method: "delete",
          url: `/api/timesheets`,
          timeout: 3000, // 3 seconds timeout
          headers: {},
          data: {
            ProjectID: projectState,
            Date: formatDate(selectedDate),
          },
        }).then(result => {
          param_CalculateHours = result.data.result.recordsets[0];

          dataView.forEach(elementDataView => {
            let employeeDuplicateCheck = 0;
            param_CalculateHours.forEach(elementParam => {
              if (elementDataView.EmployeeID == elementParam.EmployeeID)
                employeeDuplicateCheck++;
            });

            if (!employeeDuplicateCheck) {
              param_CalculateHours.push({
                EmployeeID: elementDataView.EmployeeID,
                Type: employeeTypeCheck(elementDataView.EmployeeID),
              });
            }
          });
        });

        // await tempDataView.forEach(
        //   async (
        //     employeeElement,
        //     idx_employeeElement,
        //     array_employeeElement
        //   ) => {}
        // );
        let timesheetIDArray = [];
        for (let i = 0; i < tempDataView.length; i++) {
          let timesheetID = 0;
          await axios({
            method: "post",
            url: `/api/timesheets`,
            timeout: 3000, // 3 seconds timeout
            headers: {},
            data: {
              ProjectID: projectState,
              Date: formatDate(selectedDate),
              EmployeeID: tempDataView[i].EmployeeID,
              Start: moment(tempDataView[i].StartTime).format("LT"),
              Finish: moment(tempDataView[i].EndTime).format("LT"),
              MealStart:
                tempDataView[i].MealStart == tempDataView[i].MealFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].MealStart).format("LT"),
              MealFinish:
                tempDataView[i].MealStart == tempDataView[i].MealFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].MealFinish).format("LT"),
              TravelStart:
                tempDataView[i].TravelStart == tempDataView[i].TravelFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].TravelStart).format("LT"),
              TravelFinish:
                tempDataView[i].TravelStart == tempDataView[i].TravelFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].TravelFinish).format("LT"),
              Type: employeeTypeCheck(tempDataView[i].EmployeeID),

              /* --Params--
              ${body.ProjectID},
              '${body.Date}',
              ${body.EmployeeID},
              '${body.Start}',
              '${body.Finish}',
              '${body.MealStart}',
              '${body.MealFinish}',
              '${body.TravelStart}',
              '${body.TravelFinish}',
              '${body.Type}'
              */
            },
          }).then(result => {
            timesheetID = result.data.result.recordsets[0][0].TimesheetID;
            timesheetIDArray.push(timesheetID);
          });

          for (let j = 0; j < data.length; j++) {
            if (data[j].EmployeeID == tempDataView[i].EmployeeID) {
              if (data[j].TaskID != -10 && data[j].TaskID != -11) {
                await axios({
                  method: "post",
                  url: `/api/timesheet-items`,
                  timeout: 3000, // 3 seconds timeout
                  headers: {},
                  data: {
                    TimesheetID: parseInt(timesheetID),
                    TaskID: parseInt(data[j].TaskID),
                    Start: data[j].StartTime,
                    End: data[j].EndTime,
                    ProjectID: parseInt(projectState),
                    LaborHours: data[j].TotalHours,

                    /* --Params--
                        ${body.TimesheetID},
                        ${body.TaskID},
                        '${body.Start}',
                        '${body.End}',
                        ${body.ProjectID}
                        */
                  },
                });
              }
            }

            if (i == tempDataView.length - 1 && j == data.length - 1) {
              for (let k = 0; k < param_CalculateHours.length; k++) {
                await axios({
                  method: "post",
                  url: `/api/timesheets/calculate-hours`,
                  timeout: 5000, // 5 seconds timeout
                  headers: {},
                  data: {
                    StartDate: moment(selectedDate).startOf("isoweek").toDate(),
                    EndDate: moment(selectedDate).endOf("week").toDate(),
                    ProjectID: parseInt(projectState),
                    EmployeeID: param_CalculateHours[k].EmployeeID,
                    IsOfficer:
                      param_CalculateHours[k].Type == "Officer" ? 1 : 0,
                  },
                });

                if (k == param_CalculateHours.length - 1) {
                  const myFunction = async () => {
                    for (let l = 0; l < timesheetIDArray.length; l++) {
                      axios({
                        method: "post",
                        url: `/api/timesheets/calculate-daily-earning`,
                        timeout: 8000, // 5 seconds timeout
                        headers: {},
                        data: {
                          TimesheetID: parseInt(timesheetIDArray[l]),
                        },
                      });
                    }
                  };

                  setTimeout(() => {
                    myFunction();
                  }, 1000);
                }
              }
            }
          }
        }

        // await tempDataView.forEach(
        //   async (
        //     employeeElement,
        //     idx_employeeElement,
        //     array_employeeElement
        //   ) => {}
        // );
      };

      await trackPromise(fetchData());
      await trackPromise(
        Promise.all(promises).then(() => {
          toast.success(
            <div className={styles["alert__complete"]}>
              <strong>Save Complete</strong>
            </div>,
            {
              position: toast.POSITION.BOTTOM_CENTER,
              hideProgressBar: true,
            }
          );
        })
      );
      setSelectedSummaryEmployee(0);
      setSelectedInputEmployee(0);

      axios({
        method: "post",
        url: `/api/log-daily-reports`,
        timeout: 5000, // 5 seconds timeout
        headers: {},
        data: {
          EmployeeID: status.cookies.employeeid,
          ProjectID: projectState,
          Date: formatDate(selectedDate),
          Category: "Timesheet",
          Action: "update",
        },
      });
    }
  };

  const handleSaveTimesheetBtn2 = async () => {
    if (selectedSummaryEmployee == 0) handleClickAddEmployee2();
    else handleClickUpdateEmployee2();
  };
  const { promiseInProgress } = usePromiseTracker();

  const signin = async (username, password) => {
    await axios({
      method: "post",
      url: `/api/daily-report/signin`,
      timeout: 5000, // 5 seconds timeout
      headers: {},
      data: {
        Username: username,
        Password: password,
      },
    }).then(response => {
      if (response.data.result.recordset[0] !== undefined) {
        setCookie("username", username, { path: "/", maxAge: 3600 * 24 * 30 });
        setCookie("password", password, { path: "/", maxAge: 3600 * 24 * 30 });
        setCookie("fullname", response.data.result.recordset[0].FullName, {
          path: "/",
          maxAge: 3600 * 24 * 30,
        });
        setCookie("employeeid", response.data.result.recordset[0].EmployeeID, {
          path: "/",
          maxAge: 3600 * 24 * 30,
        });
        setStatus(prevState => ({
          ...prevState,
          cookies: {
            username: username,
            password: password,
            fullname: response.data.result.recordset[0].FullName,
            employeeid: response.data.result.recordset[0].EmployeeID,
          },
        }));
      } else {
        alert("Login failed.");
      }
    });
  };

  const logout = () => {
    setData([]);
    removeCookie("username", { path: "/" });
    removeCookie("password", { path: "/" });
    removeCookie("fullname", { path: "/" });
    removeCookie("employeeid", { path: "/" });
    setStatus(prevState => ({
      permission: true,
      cookies: {
        username: undefined,
        password: 0,
        fullname: "",
        employeeid: 0,
      },
    }));
  };

  useEffect(() => {
    if (typeof stateAssignedProject[0] == "undefined") {
      setTimeout(() => {
        setStateNoAssigned(true);
      }, 3000);
    } else {
      setStateNoAssigned(false);
    }
  }, [stateAssignedProject]);

  const clickGetTheLatestData = () => {
    if (dataLatest.length !== 0) {
      setData(dataLatest);
      setSelectedSummaryEmployee(0);
      setSelectedInputEmployee(0);
    } else {
      toast.warning(
        <div className={styles["alert__table__hour-input"]}>
          No data found.
        </div>,
        {
          position: toast.POSITION.TOP_CENTER,
          hideProgressBar: true,
        }
      );
    }
  };

  const toMilli = dataTime => {
    return new Date(convertInputToTime(dataTime).replace(" ", "T"));
  };

  const employeeTypeCheck = employeeID => {
    let checkOfficer = 0;
    let checkSubsistence = 0;
    /*
    -1 Precon
    -2 Office
    -3 Supervision - On Field

    */
    data.forEach(element => {
      if (
        employeeID == element.EmployeeID &&
        (-1 == element.TaskID || -2 == element.TaskID || -3 == element.TaskID)
      ) {
        checkOfficer += 1;
        if (element.TaskID == -3) checkSubsistence++;
      }
    });

    if (checkOfficer > 0) {
      if (checkSubsistence > 0) {
        return "Officer_Subsistence";
      } else return "Officer";
    } else {
      return "Field";
    }
  };

  useEffect(() => {
    let tempData = [];
    data.forEach(element => {
      tempData.push({
        EmployeeID: element.EmployeeID,
        Name: element.EmployeeName,
        TaskID: element.TaskID,
        StartTime:
          element.TaskID == -10 || element.TaskID == -11
            ? 0
            : toMilli(element.StartTime),
        EndTime:
          element.TaskID == -10 || element.TaskID == -11
            ? 0
            : toMilli(element.EndTime),
        MealStart: element.TaskID == -10 ? toMilli(element.StartTime) : 0,
        MealFinish: element.TaskID == -10 ? toMilli(element.EndTime) : 0,
        TravelStart: element.TaskID == -11 ? toMilli(element.StartTime) : 0,
        TravelFinish: element.TaskID == -11 ? toMilli(element.EndTime) : 0,
        TotalHours:
          element.TaskID == -10 || element.TaskID == -11
            ? 0
            : element.TotalHours,
      });
    });

    let realData = [];
    //  ProjectID: projectState,
    //  Date: formatDate(selectedDate),
    //  EmployeeID: employeeElement.EmployeeID,
    //  Start: employeeElement.StartTime,
    //  Finish: employeeElement.EndTime,
    //  MealStart: employeeElement.MealStart,
    //  MealFinish: employeeElement.MealFinish,
    //  TravelStart: employeeElement.TravelStart,
    //  TravelFinish: employeeElement.TravelFinish,
    //  Type: employeeTypeCheck(employeeElement.EmployeeID),
    for (let i = 0; i < tempData.length; i++) {
      if (i === 0) {
        realData.push({
          EmployeeID: tempData[i].EmployeeID,
          TaskID: tempData[i].TaskID,
          Name: tempData[i].Name,
          StartTime: tempData[i].StartTime,
          EndTime: tempData[i].EndTime,
          MealStart: tempData[i].MealStart,
          MealFinish: tempData[i].MealFinish,
          TravelStart: tempData[i].TravelStart,
          TravelFinish: tempData[i].TravelFinish,
          TotalHours: tempData[i].TotalHours,
        });
      }
      let check = 0;
      for (let j = 0; j < realData.length; j++) {
        if (tempData[i].Name == realData[j].Name) {
          realData[j].StartTime =
            realData[j].StartTime > tempData[i].StartTime &&
            tempData[i].StartTime !== 0
              ? tempData[i].StartTime
              : realData[j].StartTime;
          realData[j].EndTime =
            (realData[j].EndTime > tempData[i].EndTime ||
              tempData[i].EndTime === 0) &&
            realData[j].EndTime !== 0
              ? realData[j].EndTime
              : tempData[i].EndTime;
          realData[j].MealStart =
            realData[j].MealStart > tempData[i].MealStart &&
            tempData[i].MealStart !== 0
              ? tempData[i].MealStart
              : realData[j].MealStart;
          realData[j].MealFinish =
            (realData[j].MealFinish > tempData[i].MealFinish ||
              tempData[i].MealFinish === 0) &&
            realData[j].MealFinish !== 0
              ? realData[j].MealFinish
              : tempData[i].MealFinish;
          realData[j].TravelStart =
            realData[j].TravelStart > tempData[i].TravelStart &&
            tempData[i].TravelStart !== 0
              ? tempData[i].TravelStart
              : realData[j].TravelStart;
          realData[j].TravelFinish =
            (realData[j].TravelFinish > tempData[i].TravelFinish ||
              tempData[i].TravelFinish === 0) &&
            realData[j].TravelFinish !== 0
              ? realData[j].TravelFinish
              : tempData[i].TravelFinish;

          if (i != 0) realData[j].TotalHours += tempData[i].TotalHours;

          check += 1;
        }
      }
      if (check === 0) {
        realData.push({
          EmployeeID: tempData[i].EmployeeID,
          Name: tempData[i].Name,
          StartTime: tempData[i].StartTime,
          EndTime: tempData[i].EndTime,
          MealStart: tempData[i].MealStart,
          MealFinish: tempData[i].MealFinish,
          TravelStart: tempData[i].TravelStart,
          TravelFinish: tempData[i].TravelFinish,
          TotalHours: tempData[i].TotalHours,
        });
      }
    }
    setDataView(realData);
  }, [data]);

  const clickAddTaskBtn = () => {
    // console.log(moment("08:00AM", "h:mma"));
    // console.log(
    //   Math.min(moment("07:00AM", "h:mma")._d, moment("04:00PM", "h:mma")._d)
    // );

    // console.log(
    //   moment(
    //     Math.min(moment("07:00AM", "h:mma")._d, moment("04:00PM", "h:mma")._d)
    //   ).format("LT")
    // );
    let taskLaborHour = 9;
    dataTable.forEach(element => {
      if (element.TaskID == -10) {
        let overlap =
          (Math.min(
            moment("04:00PM", "h:mma")._d,
            moment(element.EndTime, "h:mma")._d
          ) -
            Math.max(
              moment("07:00AM", "h:mma")._d,
              moment(element.StartTime, "h:mma")._d
            )) /
          3600000;
        taskLaborHour = 9 - overlap;
      }
    });

    setDataTable(old => [
      ...old,
      {
        Id: id++,
        EmployeeID: old[0] !== undefined ? old[0].EmployeeID : 0,
        EmployeeName: "",
        TaskID: -1, //default 'Precon'
        StartTime: "07:00AM",
        EndTime: "04:00PM",
      },
    ]);
  };

  const clickDeleteTaskBtn = Id => {
    setDataTable(old =>
      old.filter(element => {
        return element.Id !== Id;
      })
    );
  };

  const changeTaskID = (Id, value) => {
    if (value == -10) {
      if (hasMealCheck()) {
        toast.error(
          <div className={styles["alert__table__employee-input"]}>
            You cannot select 2 Meals.
          </div>,
          {
            position: toast.POSITION.TOP_CENTER,
            hideProgressBar: true,
          }
        );
        return;
      }
    }

    if (value == -10) {
      setDataTable(
        [...dataTable].map(object => {
          if (object.Id === Id) {
            return {
              ...object,
              TaskID: value,
              StartTime: "12:00PM",
              EndTime: "01:00PM",
            };
          } else return object;
        })
      );
    } else {
      setDataTable(
        [...dataTable].map(object => {
          if (object.Id === Id) {
            return {
              ...object,
              TaskID: value,
            };
          } else return object;
        })
      );
    }
  };

  const changeTime = (Id, when, format, timeValue) => {
    if (when === "start") {
      if (format === "hh") {
        setDataTable(
          [...dataTable].map(object => {
            if (object.Id === Id) {
              return {
                ...object,
                StartTime: timeValue + object.StartTime.slice(2, 7),
              };
            } else return object;
          })
        );
      } else if (format === "mm") {
        setDataTable(
          [...dataTable].map(object => {
            if (object.Id === Id) {
              return {
                ...object,
                StartTime:
                  object.StartTime.slice(0, 3) +
                  timeValue +
                  object.StartTime.slice(5, 7),
              };
            } else return object;
          })
        );
      } else {
        setDataTable(
          [...dataTable].map(object => {
            if (object.Id === Id) {
              return {
                ...object,
                StartTime: object.StartTime.slice(0, 5) + timeValue,
              };
            } else return object;
          })
        );
      }
    } else {
      if (format === "hh") {
        setDataTable(
          [...dataTable].map(object => {
            if (object.Id === Id) {
              return {
                ...object,
                EndTime: timeValue + object.EndTime.slice(2, 7),
              };
            } else return object;
          })
        );
      } else if (format === "mm") {
        setDataTable(
          [...dataTable].map(object => {
            if (object.Id === Id) {
              return {
                ...object,
                EndTime:
                  object.EndTime.slice(0, 3) +
                  timeValue +
                  object.EndTime.slice(5, 7),
              };
            } else return object;
          })
        );
      } else {
        setDataTable(
          [...dataTable].map(object => {
            if (object.Id === Id) {
              return {
                ...object,
                EndTime: object.EndTime.slice(0, 5) + timeValue,
              };
            } else return object;
          })
        );
      }
    }
  };

  useEffect(() => {
    let tempData = [];
    if (selectedSummaryEmployee !== 0) {
      data.forEach(element => {
        if (element.EmployeeID === selectedSummaryEmployee) {
          tempData.push(element);
        }
      });
    } else {
      tempData = [
        {
          Id: id++,
          EmployeeID: 0,
          EmployeeName: "",
          TaskID: -1, //default 'Precon'
          StartTime: "07:00AM",
          EndTime: "04:00PM",
        },
      ];
    }

    setDataTable(tempData);
  }, [selectedSummaryEmployee]);

  const convertEmployeeIDtoEmployeeName = id => {
    let employeeName = "";
    dataEmployees.forEach(element => {
      if (element.EmployeeID == id) {
        employeeName = element.EmployeeName;
      }
    });
    return employeeName;
  };

  const handleClickAddEmployee = () => {
    if (selectedInputEmployee == 0) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to add. <br /> Please choose <strong>Employee</strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }

    let tempData = dataTable;
    let resultData = [];
    tempData.forEach(el1 => {
      dataLaborHours.forEach(el2 => {
        if (el1.Id == el2.Id) {
          resultData.push({
            ...el1,
            TotalHours: el2.TaskLaborHours,
          });
        }
      });
    });

    let check = 0;
    resultData.forEach(element => {
      if (element.TaskID == 0) {
        check += 1;
      }
      element.EmployeeID = selectedInputEmployee;
      element.EmployeeName = convertEmployeeIDtoEmployeeName(
        selectedInputEmployee
      );
    });

    if (check > 0) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to add. <br /> Please choose <strong>Task</strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }

    setData(old => [...old, ...resultData]);
    setSelectedSummaryEmployee(selectedInputEmployee);
  };

  const handleClickAddEmployee2 = () => {
    if (selectedInputEmployee == 0) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to add. <br /> Please choose <strong>Employee</strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }
    let oldData = data;
    let tempData = dataTable;
    let resultData = [];
    tempData.forEach(el1 => {
      dataLaborHours.forEach(el2 => {
        if (el1.Id == el2.Id) {
          resultData.push({
            ...el1,
            TotalHours: el2.TaskLaborHours,
          });
        }
      });
    });

    let check = 0;
    resultData.forEach(element => {
      if (element.TaskID == 0) {
        check += 1;
      }
      element.EmployeeID = selectedInputEmployee;
      element.EmployeeName = convertEmployeeIDtoEmployeeName(
        selectedInputEmployee
      );
    });

    if (check > 0) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to add. <br /> Please choose <strong>Task</strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }

    setData(old => [...old, ...resultData]);
    setData2([...oldData, ...resultData]);
  };

  useEffect(() => {
    if (typeof data2 == "undefined") return;
    else if (data2.init == "first") return;
    let tempData = [];
    data2.forEach(element => {
      tempData.push({
        EmployeeID: element.EmployeeID,
        Name: element.EmployeeName,
        TaskID: element.TaskID,
        StartTime:
          element.TaskID == -10 || element.TaskID == -11
            ? 0
            : toMilli(element.StartTime),
        EndTime:
          element.TaskID == -10 || element.TaskID == -11
            ? 0
            : toMilli(element.EndTime),
        MealStart: element.TaskID == -10 ? toMilli(element.StartTime) : 0,
        MealFinish: element.TaskID == -10 ? toMilli(element.EndTime) : 0,
        TravelStart: element.TaskID == -11 ? toMilli(element.StartTime) : 0,
        TravelFinish: element.TaskID == -11 ? toMilli(element.EndTime) : 0,
        TotalHours:
          element.TaskID == -10 || element.TaskID == -11
            ? 0
            : element.TotalHours,
      });
    });

    let realData = [];
    //  ProjectID: projectState,
    //  Date: formatDate(selectedDate),
    //  EmployeeID: employeeElement.EmployeeID,
    //  Start: employeeElement.StartTime,
    //  Finish: employeeElement.EndTime,
    //  MealStart: employeeElement.MealStart,
    //  MealFinish: employeeElement.MealFinish,
    //  TravelStart: employeeElement.TravelStart,
    //  TravelFinish: employeeElement.TravelFinish,
    //  Type: employeeTypeCheck(employeeElement.EmployeeID),
    for (let i = 0; i < tempData.length; i++) {
      if (i === 0) {
        realData.push({
          EmployeeID: tempData[i].EmployeeID,
          TaskID: tempData[i].TaskID,
          Name: tempData[i].Name,
          StartTime: tempData[i].StartTime,
          EndTime: tempData[i].EndTime,
          MealStart: tempData[i].MealStart,
          MealFinish: tempData[i].MealFinish,
          TravelStart: tempData[i].TravelStart,
          TravelFinish: tempData[i].TravelFinish,
          TotalHours: tempData[i].TotalHours,
        });
      }
      let check = 0;
      for (let j = 0; j < realData.length; j++) {
        if (tempData[i].Name == realData[j].Name) {
          realData[j].StartTime =
            realData[j].StartTime > tempData[i].StartTime &&
            tempData[i].StartTime !== 0
              ? tempData[i].StartTime
              : realData[j].StartTime;
          realData[j].EndTime =
            (realData[j].EndTime > tempData[i].EndTime ||
              tempData[i].EndTime === 0) &&
            realData[j].EndTime !== 0
              ? realData[j].EndTime
              : tempData[i].EndTime;
          realData[j].MealStart =
            realData[j].MealStart > tempData[i].MealStart &&
            tempData[i].MealStart !== 0
              ? tempData[i].MealStart
              : realData[j].MealStart;
          realData[j].MealFinish =
            (realData[j].MealFinish > tempData[i].MealFinish ||
              tempData[i].MealFinish === 0) &&
            realData[j].MealFinish !== 0
              ? realData[j].MealFinish
              : tempData[i].MealFinish;
          realData[j].TravelStart =
            realData[j].TravelStart > tempData[i].TravelStart &&
            tempData[i].TravelStart !== 0
              ? tempData[i].TravelStart
              : realData[j].TravelStart;
          realData[j].TravelFinish =
            (realData[j].TravelFinish > tempData[i].TravelFinish ||
              tempData[i].TravelFinish === 0) &&
            realData[j].TravelFinish !== 0
              ? realData[j].TravelFinish
              : tempData[i].TravelFinish;

          if (i != 0) realData[j].TotalHours += tempData[i].TotalHours;

          check += 1;
        }
      }
      if (check === 0) {
        realData.push({
          EmployeeID: tempData[i].EmployeeID,
          Name: tempData[i].Name,
          StartTime: tempData[i].StartTime,
          EndTime: tempData[i].EndTime,
          MealStart: tempData[i].MealStart,
          MealFinish: tempData[i].MealFinish,
          TravelStart: tempData[i].TravelStart,
          TravelFinish: tempData[i].TravelFinish,
          TotalHours: tempData[i].TotalHours,
        });
      }
    }
    setDataView2(realData);
  }, [data2]);

  useEffect(() => {
    if (typeof dataView2 == "undefined") return;
    else if (dataView2.init == "first") return;
    let promises = [];
    let param_CalculateHours = [];

    let checkEmployeeName = data2.find(element => element.EmployeeID == 0);
    let checkTaskName = data2.find(element => element.TaskID == 0);

    if (checkEmployeeName) {
      checkSave += 1;
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to save. <br /> Please check <strong>Employee Name </strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    } else if (checkTaskName) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to save. <br /> Please check <strong>Task Name </strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    } else {
      const fetchData = async () => {
        let tempDataView = dataView2.sort(compare);

        await axios({
          method: "delete",
          url: `/api/timesheets`,
          timeout: 3000, // 3 seconds timeout
          headers: {},
          data: {
            ProjectID: projectState,
            Date: formatDate(selectedDate),
          },
        }).then(result => {
          param_CalculateHours = result.data.result.recordsets[0];

          dataView2.forEach(elementDataView => {
            let employeeDuplicateCheck = 0;
            param_CalculateHours.forEach(elementParam => {
              if (elementDataView.EmployeeID == elementParam.EmployeeID)
                employeeDuplicateCheck++;
            });

            if (!employeeDuplicateCheck) {
              param_CalculateHours.push({
                EmployeeID: elementDataView.EmployeeID,
                Type: employeeTypeCheck(elementDataView.EmployeeID),
              });
            }
          });
        });

        // await tempDataView.forEach(
        //   async (
        //     employeeElement,
        //     idx_employeeElement,
        //     array_employeeElement
        //   ) => {}
        // );
        let timesheetIDArray = [];
        for (let i = 0; i < tempDataView.length; i++) {
          let timesheetID = 0;
          await axios({
            method: "post",
            url: `/api/timesheets`,
            timeout: 3000, // 3 seconds timeout
            headers: {},
            data: {
              ProjectID: projectState,
              Date: formatDate(selectedDate),
              EmployeeID: tempDataView[i].EmployeeID,
              Start: moment(tempDataView[i].StartTime).format("LT"),
              Finish: moment(tempDataView[i].EndTime).format("LT"),
              MealStart:
                tempDataView[i].MealStart == tempDataView[i].MealFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].MealStart).format("LT"),
              MealFinish:
                tempDataView[i].MealStart == tempDataView[i].MealFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].MealFinish).format("LT"),
              TravelStart:
                tempDataView[i].TravelStart == tempDataView[i].TravelFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].TravelStart).format("LT"),
              TravelFinish:
                tempDataView[i].TravelStart == tempDataView[i].TravelFinish
                  ? "12:00:00"
                  : moment(tempDataView[i].TravelFinish).format("LT"),
              Type: employeeTypeCheck(tempDataView[i].EmployeeID),

              /* --Params--
              ${body.ProjectID},
              '${body.Date}',
              ${body.EmployeeID},
              '${body.Start}',
              '${body.Finish}',
              '${body.MealStart}',
              '${body.MealFinish}',
              '${body.TravelStart}',
              '${body.TravelFinish}',
              '${body.Type}'
              */
            },
          }).then(result => {
            timesheetID = result.data.result.recordsets[0][0].TimesheetID;
            timesheetIDArray.push(timesheetID);
          });

          for (let j = 0; j < data2.length; j++) {
            if (data2[j].EmployeeID == tempDataView[i].EmployeeID) {
              if (data2[j].TaskID != -10 && data2[j].TaskID != -11) {
                await axios({
                  method: "post",
                  url: `/api/timesheet-items`,
                  timeout: 3000, // 3 seconds timeout
                  headers: {},
                  data: {
                    TimesheetID: parseInt(timesheetID),
                    TaskID: parseInt(data[j].TaskID),
                    Start: data2[j].StartTime,
                    End: data2[j].EndTime,
                    ProjectID: parseInt(projectState),
                    LaborHours: data2[j].TotalHours,

                    /* --Params--
                        ${body.TimesheetID},
                        ${body.TaskID},
                        '${body.Start}',
                        '${body.End}',
                        ${body.ProjectID}
                        */
                  },
                });
              }
            }

            if (i == tempDataView.length - 1 && j == data2.length - 1) {
              for (let k = 0; k < param_CalculateHours.length; k++) {
                await axios({
                  method: "post",
                  url: `/api/timesheets/calculate-hours`,
                  timeout: 5000, // 5 seconds timeout
                  headers: {},
                  data: {
                    StartDate: moment(selectedDate).startOf("isoweek").toDate(),
                    EndDate: moment(selectedDate).endOf("week").toDate(),
                    ProjectID: parseInt(projectState),
                    EmployeeID: param_CalculateHours[k].EmployeeID,
                    IsOfficer:
                      param_CalculateHours[k].Type == "Officer" ? 1 : 0,
                  },
                });
                if (k == param_CalculateHours.length - 1) {
                  const myFunction = async () => {
                    for (let l = 0; l < timesheetIDArray.length; l++) {
                      axios({
                        method: "post",
                        url: `/api/timesheets/calculate-daily-earning`,
                        timeout: 8000, // 5 seconds timeout
                        headers: {},
                        data: {
                          TimesheetID: parseInt(timesheetIDArray[l]),
                        },
                      });
                    }
                  };

                  setTimeout(() => {
                    myFunction();
                  }, 1000);
                }
              }
            }
          }
        }

        // await tempDataView.forEach(
        //   async (
        //     employeeElement,
        //     idx_employeeElement,
        //     array_employeeElement
        //   ) => {}
        // );
      };

      trackPromise(fetchData());
      trackPromise(
        Promise.all(promises).then(() => {
          toast.success(
            <div className={styles["alert__complete"]}>
              <strong>Save Complete</strong>
            </div>,
            {
              position: toast.POSITION.BOTTOM_CENTER,
              hideProgressBar: true,
            }
          );
        })
      );
      setSelectedSummaryEmployee(0);
      setSelectedInputEmployee(0);

      axios({
        method: "post",
        url: `/api/log-daily-reports`,
        timeout: 5000, // 5 seconds timeout
        headers: {},
        data: {
          EmployeeID: status.cookies.employeeid,
          ProjectID: projectState,
          Date: formatDate(selectedDate),
          Category: "Timesheet",
          Action: "update",
        },
      });
    }
  }, [dataView2]);

  const handleClickUpdateEmployee = () => {
    let tempData = [];
    data.forEach(element => {
      if (element.EmployeeID != selectedInputEmployee) tempData.push(element);
    });
    let tempDataTable = dataTable;
    let resultData = [];
    tempDataTable.forEach(el1 => {
      dataLaborHours.forEach(el2 => {
        if (el1.Id == el2.Id) {
          resultData.push({
            ...el1,
            TotalHours: el2.TaskLaborHours,
          });
        }
      });
    });

    let check = 0;
    resultData.forEach(element => {
      if (element.TaskID == 0) {
        check += 1;
      }
      element.EmployeeID = selectedInputEmployee;
      element.EmployeeName = convertEmployeeIDtoEmployeeName(
        selectedInputEmployee
      );
    });
    if (check > 0) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to add. <br /> Please choose <strong>Task</strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }
    setData(() => [...tempData, ...resultData]);
    setSelectedInputEmployee(0);
    setSelectedSummaryEmployee(0);
  };

  const handleClickUpdateEmployee2 = () => {
    let tempData = [];
    data.forEach(element => {
      if (element.EmployeeID != selectedInputEmployee) tempData.push(element);
    });
    let tempDataTable = dataTable;
    let resultData = [];
    tempDataTable.forEach(el1 => {
      dataLaborHours.forEach(el2 => {
        if (el1.Id == el2.Id) {
          resultData.push({
            ...el1,
            TotalHours: el2.TaskLaborHours,
          });
        }
      });
    });

    let check = 0;
    resultData.forEach(element => {
      if (element.TaskID == 0) {
        check += 1;
      }
      element.EmployeeID = selectedInputEmployee;
      element.EmployeeName = convertEmployeeIDtoEmployeeName(
        selectedInputEmployee
      );
    });
    if (check > 0) {
      toast.error(
        <div className={styles["alert__table__employee-input"]}>
          Unable to add. <br /> Please choose <strong>Task</strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }
    setData(() => [...tempData, ...resultData]);
    setData2(() => [...tempData, ...resultData]);
    setSelectedInputEmployee(0);
    setSelectedSummaryEmployee(0);
  };

  const handleSetSameTask = () => {
    if (data.length === 0) {
      toast.warning(
        <div className={styles["alert__table__hour-input"]}>
          No task found.
        </div>,
        {
          position: toast.POSITION.TOP_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }

    let tempEmployeeID = [];
    let tempDataTask = [];
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        tempEmployeeID.push(data[0].EmployeeID);
      } else {
        if (data[i].EmployeeID != data[i - 1].EmployeeID) {
          tempEmployeeID.push(data[i].EmployeeID);
        }
      }

      if (data[i].EmployeeID == data[0].EmployeeID) {
        tempDataTask.push(data[i]);
      }
    }

    tempEmployeeID = new Set(tempEmployeeID);
    let tempData = [];
    tempEmployeeID.forEach(element => {
      tempDataTask.forEach(task => {
        tempData.push({
          ...task,
          EmployeeID: element,
          Id: id++,
          EmployeeName: convertEmployeeIDtoEmployeeName(element),
        });
      });
    });

    setData(() => tempData);
    setDataTable(() => tempDataTask);
  };

  const hasMealCheck = () => {
    let check = 0;
    dataTable.forEach(element => {
      if (element.TaskID == -10) {
        check++;
      }
    });

    if (check) return true;
    else return false;
  };

  useEffect(() => {
    // let taskLaborHour =
    //   (moment(object.EndTime, "h:mma")._d -
    //     moment(object.StartTime, "h:mma")._d) /
    //   3600000;
    // if (object.TaskID != -2) {
    //   dataTable.forEach(element => {
    //     if (element.TaskID == -2) {
    //       let overlap =
    //         (Math.min(
    //           moment(object.EndTime, "h:mma")._d,
    //           moment(element.EndTime, "h:mma")._d
    //         ) -
    //           Math.max(
    //             moment(object.StartTime, "h:mma")._d,
    //             moment(element.StartTime, "h:mma")._d
    //           )) /
    //         3600000;
    //       taskLaborHour = taskLaborHour - overlap;
    //     }
    //   });
    // }

    let tempDataTable = dataTable;
    let resultTable = [];
    tempDataTable.forEach(el => {
      let taskLaborHours =
        (moment(el.EndTime, "h:mma")._d - moment(el.StartTime, "h:mma")._d) /
        3600000;
      if (el.TaskID != -10) {
        tempDataTable.forEach(element => {
          if (element.TaskID == -10) {
            if (
              moment(el.StartTime, "h:mma")._d - 0 <=
                moment(element.EndTime, "h:mma")._d - 0 &&
              moment(el.EndTime, "h:mma")._d - 0 >=
                moment(element.StartTime, "h:mma")._d - 0
            ) {
              let overlap =
                (Math.min(
                  moment(el.EndTime, "h:mma")._d,
                  moment(element.EndTime, "h:mma")._d
                ) -
                  Math.max(
                    moment(el.StartTime, "h:mma")._d,
                    moment(element.StartTime, "h:mma")._d
                  )) /
                3600000;
              taskLaborHours = taskLaborHours - overlap;
            } else {
              let overlap = 0;
              taskLaborHours = taskLaborHours - overlap;
            }
          }
        });
      }
      resultTable.push({
        Id: el.Id,
        TaskLaborHours: taskLaborHours,
      });
    });

    setDataLaborHours(resultTable);
  }, [dataTable]);

  const popupClickGetTheLatestData = () => {
    if (confirm("Are you sure you want to IMPORT LAST TIMESHEET?")) {
      // Save it!
      clickGetTheLatestData();
    } else {
      // Do nothing!
      console.log("Do nothing");
    }
  };

  return (
    <>
      {/* {console.log("data")}
      {console.log(data)}
      {console.log("dataView")}
      {console.log(dataView)}
      {console.log("dataTable")}
      {console.log(dataTable)}
      {console.log("dataLaborHours")}
      {console.log(dataLaborHours)} */}
      {console.log(now)}

      <Head>
        <title>Daily Report</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      {status.cookies.username === undefined ||
      status.cookies.employeeid === undefined ? (
        <Login signin={signin} />
      ) : !status.permission || stateNoAssigned === true ? (
        <NotPermission path="timesheet" />
      ) : (
        <>
          <MainTab
            tapNo={2}
            main={false}
            employeeID={status.cookies.employeeid}
            employeeName={status.cookies.fullname}
            logout={logout}
            projectState={router.query.pid}
          />
          <div id={styles.mainDiv}>
            {promiseInProgress || !projectState ? (
              <div
                style={{
                  marginTop: "30px",
                  width: "100%",
                  height: "100",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Loader type="Oval" color="#fab906" height="150" width="150" />
              </div>
            ) : (
              <>
                <h1 className={styles["title"]}>Timesheet</h1>

                <div className={styles["header"]}>
                  <div className={styles["header__left"]}>
                    <select
                      id="project-state-id"
                      value={projectState}
                      onChange={e => setProjectState(e.target.value)}
                      style={{
                        fontFamily: "Roboto, sans-serif",
                        fontSize: "medium",
                        display: "inline-block",
                        color: "#74646e",
                        border: "1px solid #c8bfc4",
                        borderRadius: "4px",
                        boxShadow: "inset 1px 1px 2px #ddd8dc",
                        background: "#fff",
                        zIndex: "0",
                        position: "relative",
                        width: "760px",
                        maxWidth: "760px",
                        height: "30px",
                      }}
                    >
                      {stateAssignedProject.map(item => {
                        return (
                          <option
                            value={item.ProjectID}
                            key={item.ProjectID}
                            projectgroup={item.ProjectGroup}
                            projectname={item.ProjectName}
                            contractno={item.ContractNumber}
                          >
                            {item.JobNumber} &emsp;[{item.ProjectGroup}]&ensp;
                            {item.ProjectName}
                          </option>
                        );
                      })}
                    </select>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                      <DatePicker
                        margin="normal"
                        id="datePickerDialog"
                        format="MM/dd/yyyy"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className={styles["header__right__date-picker"]}
                        autoOk={true}
                        okLabel=""
                      />
                    </MuiPickersUtilsProvider>
                  </div>
                  <div className={styles["header__right"]}>
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        className={
                          dateCheckEditable(selectedDate)
                            ? styles["header__right__save-btn"]
                            : styles["header__right__save-btn-before-sunday"]
                        }
                        onClick={
                          selectedInputEmployee == 0
                            ? handleSaveTimesheetBtn
                            : handleSaveTimesheetBtn2
                        }
                        startIcon={<SaveIcon />}
                      >
                        Save
                      </Button>
                      {selectedSummaryEmployee ? (
                        <Button
                          id="add-employee-button-id"
                          variant="contained"
                          color="secondary"
                          size="small"
                          className={
                            dateCheckEditable(selectedDate)
                              ? styles["header__right__update-btn"]
                              : styles[
                                  "header__right__update-btn-before-sunday"
                                ]
                          }
                          disabled={checkDisableAddEmployeeButton}
                          onClick={handleClickUpdateEmployee}
                        >
                          Update Employee
                        </Button>
                      ) : (
                        <Button
                          id="add-employee-button-id"
                          variant="contained"
                          color="secondary"
                          size="small"
                          className={
                            dateCheckEditable(selectedDate)
                              ? styles["header__right__add-btn"]
                              : styles["header__right__add-btn-before-sunday"]
                          }
                          disabled={checkDisableAddEmployeeButton}
                          onClick={handleClickAddEmployee}
                        >
                          Add Employee
                        </Button>
                      )}

                      <Button
                        onClick={popupClickGetTheLatestData}
                        // onClick={clickGetTheLatestData}
                        variant="contained"
                        size="small"
                        className={
                          dateCheckEditable(selectedDate)
                            ? styles["header__right__save-btn"]
                            : styles["header__right__save-btn-before-sunday"]
                        }
                        disabled={afterSundayCheck ? false : true}
                        style={{
                          background: "#25a37d",
                          color: "#ffffff",
                          marginRight: "10px",
                        }}
                      >
                        Import Last Timesheet
                      </Button>
                      <Button
                        onClick={handleSetSameTask}
                        // onClick={handleSetSameTask}
                        variant="contained"
                        size="small"
                        className={
                          dateCheckEditable(selectedDate)
                            ? styles["header__right__save-btn"]
                            : styles["header__right__save-btn-before-sunday"]
                        }
                        disabled={afterSundayCheck ? false : true}
                        style={{
                          background: "#43b6d3",
                          color: "#ffffff",
                          marginRight: "10px",
                        }}
                      >
                        Copy First Employee
                      </Button>
                      <div className={styles["employee-dropdown-wrapper"]}>
                        {!selectedSummaryEmployee ? (
                          <select
                            className={styles["employee-dropdown"]}
                            value={selectedInputEmployee}
                            onChange={e =>
                              setSelectedInputEmployee(e.target.value)
                            }
                            disabled={afterSundayCheck ? false : true}
                            style={
                              !afterSundayCheck && data.length === 0
                                ? { display: "none" }
                                : {}
                            }
                          >
                            <option value="0">----Choose Employee----</option>
                            {dataEmployees.map(element => {
                              for (let i = 0; i < data.length; i++) {
                                if (element.EmployeeID == data[i].EmployeeID)
                                  return null;
                              }
                              return (
                                <option
                                  key={element.EmployeeID}
                                  value={element.EmployeeID}
                                >
                                  {element.EmployeeName}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <select
                            className={styles["employee-dropdown"]}
                            value={selectedSummaryEmployee}
                            onChange={e =>
                              setSelectedInputEmployee(e.target.value)
                            }
                            disabled={true}
                          >
                            <option value="0">
                              --------Choose Employee--------
                            </option>
                            {dataEmployees.map(element => {
                              return (
                                <option
                                  key={element.EmployeeID}
                                  value={element.EmployeeID}
                                >
                                  {element.EmployeeName}
                                </option>
                              );
                            })}
                          </select>
                        )}

                        {afterSundayCheck && (
                          <Button
                            onClick={clickAddTaskBtn}
                            variant="contained"
                            size="small"
                            className={
                              dateCheckEditable(selectedDate)
                                ? styles["header__right__add-task-btn"]
                                : styles[
                                    "header__right__add-task-before-sunday"
                                  ]
                            }
                          >
                            Add Task
                          </Button>
                        )}
                      </div>
                    </>
                  </div>
                </div>
                <div>
                  <div
                    className={styles["table"]}
                    style={
                      !afterSundayCheck && data.length === 0
                        ? { display: "none" }
                        : {}
                    }
                  >
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell width={resolution712 ? 250 : 450}>
                              Task
                            </TableCell>
                            <TableCell widht={80}>Start Time</TableCell>
                            <TableCell widht={80}>End Time</TableCell>
                            <TableCell widht={70}>Hours</TableCell>
                            <TableCell widht={10}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dataTable.map(element => {
                            return (
                              <TableRow key={element.Id}>
                                <TableCell>
                                  <div>
                                    <select
                                      className={styles["task-dropdown"]}
                                      value={element.TaskID}
                                      onChange={e =>
                                        changeTaskID(element.Id, e.target.value)
                                      }
                                      disabled={afterSundayCheck ? false : true}
                                    >
                                      {dataTasks.map(elementTask => {
                                        return (
                                          <option
                                            key={elementTask.TaskID}
                                            value={elementTask.TaskID}
                                          >
                                            {elementTask.Name}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div
                                    className={styles["table__time-wrapper"]}
                                  >
                                    <select
                                      className={classNames(
                                        "table__time-wrapper__target-disabled",
                                        styles["table__hour-dropdown"]
                                      )}
                                      disabled={afterSundayCheck ? false : true}
                                      value={element.StartTime.slice(0, 2)}
                                      onChange={e =>
                                        changeTime(
                                          element.Id,
                                          "start",
                                          "hh",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="00">00</option>
                                      <option value="01">01</option>
                                      <option value="02">02</option>
                                      <option value="03">03</option>
                                      <option value="04">04</option>
                                      <option value="05">05</option>
                                      <option value="06">06</option>
                                      <option value="07">07</option>
                                      <option value="08">08</option>
                                      <option value="09">09</option>
                                      <option value="10">10</option>
                                      <option value="11">11</option>
                                      <option value="12">12</option>
                                    </select>
                                    :
                                    <select
                                      className={classNames(
                                        "table__time-wrapper__target-disabled",
                                        styles["table__min-dropdown"]
                                      )}
                                      disabled={afterSundayCheck ? false : true}
                                      value={element.StartTime.slice(3, 5)}
                                      onChange={e =>
                                        changeTime(
                                          element.Id,
                                          "start",
                                          "mm",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="00">00</option>
                                      <option value="10">10</option>
                                      <option value="20">20</option>
                                      <option value="30">30</option>
                                      <option value="40">40</option>
                                      <option value="50">50</option>
                                    </select>
                                    <select
                                      className={classNames(
                                        "table__time-wrapper__target-disabled",
                                        styles["table__ampm-dropdown"]
                                      )}
                                      disabled={afterSundayCheck ? false : true}
                                      value={element.StartTime.slice(5, 7)}
                                      onChange={e =>
                                        changeTime(
                                          element.Id,
                                          "start",
                                          "AP",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="AM">AM</option>
                                      <option value="PM">PM</option>
                                    </select>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div
                                    className={styles["table__time-wrapper"]}
                                  >
                                    <select
                                      className={classNames(
                                        "table__time-wrapper__target-disabled",
                                        styles["table__hour-dropdown"]
                                      )}
                                      disabled={afterSundayCheck ? false : true}
                                      value={element.EndTime.slice(0, 2)}
                                      onChange={e =>
                                        changeTime(
                                          element.Id,
                                          "end",
                                          "hh",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="00">00</option>
                                      <option value="01">01</option>
                                      <option value="02">02</option>
                                      <option value="03">03</option>
                                      <option value="04">04</option>
                                      <option value="05">05</option>
                                      <option value="06">06</option>
                                      <option value="07">07</option>
                                      <option value="08">08</option>
                                      <option value="09">09</option>
                                      <option value="10">10</option>
                                      <option value="11">11</option>
                                      <option value="12">12</option>
                                    </select>
                                    :
                                    <select
                                      className={classNames(
                                        "table__time-wrapper__target-disabled",
                                        styles["table__min-dropdown"]
                                      )}
                                      disabled={afterSundayCheck ? false : true}
                                      value={element.EndTime.slice(3, 5)}
                                      onChange={e =>
                                        changeTime(
                                          element.Id,
                                          "end",
                                          "mm",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="00">00</option>
                                      <option value="10">10</option>
                                      <option value="20">20</option>
                                      <option value="30">30</option>
                                      <option value="40">40</option>
                                      <option value="50">50</option>
                                    </select>
                                    <select
                                      className={classNames(
                                        "table__time-wrapper__target-disabled",
                                        styles["table__ampm-dropdown"]
                                      )}
                                      disabled={afterSundayCheck ? false : true}
                                      value={element.EndTime.slice(5, 7)}
                                      onChange={e =>
                                        changeTime(
                                          element.Id,
                                          "end",
                                          "AP",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="AM">AM</option>
                                      <option value="PM">PM</option>
                                    </select>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <span>
                                      {dataLaborHours.map(el => {
                                        if (el.Id == element.Id) {
                                          return el.TaskLaborHours.toFixed(2);
                                        }
                                      })}

                                      {/* {(
                                        (new Date(
                                          convertInputToTime(
                                            element.EndTime
                                          ).replace(" ", "T")
                                        ) -
                                          new Date(
                                            convertInputToTime(
                                              element.StartTime
                                            ).replace(" ", "T")
                                          )) /
                                        3600000
                                      ).toFixed(2)} */}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div
                                    className={styles["table__delete-input"]}
                                  >
                                    <DeleteForeverIcon
                                      color="action"
                                      className={styles["table__delete-icon"]}
                                      onClick={() => {
                                        afterSundayCheck &&
                                          clickDeleteTaskBtn(element.Id);
                                      }}
                                    ></DeleteForeverIcon>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                </div>

                {dataView.length === 0 ? (
                  <></>
                ) : (
                  <div className={styles["second-table"]}>
                    <table style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Start</th>
                          <th>Finish</th>
                          <th>Meal Start</th>
                          <th>Meal Finish</th>
                          <th>Labor Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataView.map(cell => {
                          return (
                            <tr
                              key={cell.Name}
                              style={
                                cell.EmployeeID === selectedSummaryEmployee
                                  ? {
                                      backgroundColor: "#95b5e0",
                                    }
                                  : {}
                              }
                              onClick={() => {
                                if (
                                  cell.EmployeeID === selectedSummaryEmployee
                                ) {
                                  setSelectedSummaryEmployee(0);
                                  setSelectedInputEmployee(0);
                                } else {
                                  setSelectedSummaryEmployee(cell.EmployeeID);
                                  setSelectedInputEmployee(cell.EmployeeID);
                                }
                              }}
                            >
                              <td
                                style={
                                  cell.EmployeeID === selectedSummaryEmployee
                                    ? {
                                        color: "#ffffff",
                                        fontWeight: "500",
                                      }
                                    : { fontWeight: "500", color: "#8f8c8c" }
                                }
                              >
                                {cell.Name}
                              </td>
                              <td
                                style={
                                  cell.EmployeeID === selectedSummaryEmployee
                                    ? {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#ffffff",
                                      }
                                    : {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#8f8c8c",
                                      }
                                }
                              >
                                {moment(cell.StartTime).format("LT") ===
                                moment(cell.EndTime).format("LT")
                                  ? ""
                                  : moment(cell.StartTime).format("LT")}
                              </td>
                              <td
                                style={
                                  cell.EmployeeID === selectedSummaryEmployee
                                    ? {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#ffffff",
                                      }
                                    : {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#8f8c8c",
                                      }
                                }
                              >
                                {moment(cell.StartTime).format("LT") ===
                                moment(cell.EndTime).format("LT")
                                  ? ""
                                  : moment(cell.EndTime).format("LT")}
                              </td>
                              <td
                                style={
                                  cell.EmployeeID === selectedSummaryEmployee
                                    ? {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#ffffff",
                                      }
                                    : {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#8f8c8c",
                                      }
                                }
                              >
                                {moment(cell.MealStart).format("LT") ===
                                moment(cell.MealFinish).format("LT")
                                  ? ""
                                  : moment(cell.MealStart).format("LT")}
                              </td>
                              <td
                                style={
                                  cell.EmployeeID === selectedSummaryEmployee
                                    ? {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#ffffff",
                                      }
                                    : {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#8f8c8c",
                                      }
                                }
                              >
                                {moment(cell.MealStart).format("LT") ===
                                moment(cell.MealFinish).format("LT")
                                  ? ""
                                  : moment(cell.MealFinish).format("LT")}
                              </td>
                              <td
                                style={
                                  cell.EmployeeID === selectedSummaryEmployee
                                    ? {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#ffffff",
                                      }
                                    : {
                                        textAlign: "right",
                                        width: "100px",
                                        fontWeight: "500",
                                        color: "#8f8c8c",
                                      }
                                }
                              >
                                {cell.TotalHours.toFixed(2)}
                                {/* {cell.StartTime <= cell.MealFinish &&
                                cell.EndTime >= cell.MealStart
                                  ? (
                                      (cell.EndTime -
                                        cell.StartTime -
                                        (Math.min(
                                          cell.EndTime,
                                          cell.MealFinish
                                        ) -
                                          Math.max(
                                            cell.StartTime,
                                            cell.MealStart
                                          ))) /
                                      3600000
                                    ).toFixed(2)
                                  : (
                                      (cell.EndTime - cell.StartTime) /
                                      3600000
                                    ).toFixed(2)} */}

                                {/* {(
                                  (cell.EndTime -
                                    cell.StartTime -
                                    (cell.MealFinish - cell.MealStart)) /
                                  3600000
                                ).toFixed(2)} */}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Timesheet;
