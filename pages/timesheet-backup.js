import { useState, useMemo, useEffect } from "react";
import axios from "axios";

import { useTable, useBlockLayout } from "react-table";
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

toast.configure();
let afterSundayCheck = true;
let dataEmployees;
let dataTasks;

const convertInputToTime = time => {
  let match = inputTime.filter(data => data.input === time);
  if (match[0] === undefined) {
    return "error";
  }
  return match[0].time;
};

const Timesheet = () => {
  const router = useRouter();
  const [projectState, setProjectState] = useState(undefined);
  const [stateAssignedProject, setStateAssignedProject] = useState([]);
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
    const sundayOfSelected = getSunday(dateFromStr);
    const sundayOfToday = getSunday(now);
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

  const columns = useMemo(
    () => [
      {
        Header: " ",
        accessor: "TimesheetID",
        width: 30,
      },
      {
        Header: "Employee Name",
        accessor: "EmployeeName",
        width: 200,
      },
      {
        Header: "Task",
        accessor: "Task",
        width: 240,
      },

      {
        Header: "Work Start",
        accessor: "WorkStart",
        width: 160,
      },
      {
        Header: "Meal Start",
        accessor: "MealStart",
        width: 160,
      },
      {
        Header: "Meal End",
        accessor: "MealEnd",
        width: 160,
      },
      {
        Header: "Work End",
        accessor: "WorkEnd",
        width: 160,
      },
      {
        Header: "Labor Hours",
        accessor: "laborHours",
        width: 120,
      },
    ],
    []
  );

  const [data, setData] = useState(() => []);
  // const [dataEmployees, setDataEmployees] = useState(() => []);

  // Create an editable cell renderer
  const EditableCell = ({
    value: initialValue,
    row: { index },
    column: { id },
    row,
    updateMyData, // This is a custom function that we supplied to our table instance
  }) => {
    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue);

    const onCheckHour = e => {
      if (12 < parseInt(e.target.value) || "00" === e.target.value) {
        toast.warning(
          <div className={styles["alert__table__hour-input"]}>
            Only <strong>01 to 12</strong> can be entered into the time hour
            input.
          </div>,
          {
            position: toast.POSITION.BOTTOM_CENTER,
            hideProgressBar: true,
          }
        );
        setValue("  :" + value.slice(3, 5) + value.slice(5, 7));
      } else {
        setValue(e.target.value + ":" + value.slice(3, 5) + value.slice(5, 7));
      }
    };

    const onCheckMin = e => {
      setValue(value.slice(0, 2) + ":" + e.target.value + value.slice(5, 7));
    };

    const onCheckAmPm = e => {
      if (e.target.value === "AM") {
        setValue(value.slice(0, 2) + ":" + value.slice(3, 5) + "AM");
      } else if (e.target.value === "PM") {
        setValue(value.slice(0, 2) + ":" + value.slice(3, 5) + "PM");
      } else {
        setValue(value.slice(0, 2) + ":" + value.slice(3, 5) + e.target.value);
      }
    };

    const onChange = e => {
      setValue(e.target.value);
    };

    const onChangeSelectEmployee = value => {
      setValue(value);
      updateEmployeeData(index, id, value);
    };

    const onChangeSelectTasks = value => {
      setValue(value);
      updateTaskData(index, id, value);
    };

    // We'll only update the external data when the input is blurred
    const onBlur = e => {
      if (document.getElementById("checkboxForSetSameTime")) {
        if (document.getElementById("checkboxForSetSameTime").checked) {
          updateMyData(index, id, value);
          setSameTime();
        } else {
          updateMyData(index, id, value);
        }
      } else {
        updateMyData(index, id, value); //important bug fix but why?
      }
    };

    const onBlurForEmployee = e => {
      updateEmployeeData(index, id, value);
    };

    const onBlurForTasks = e => {
      updateTaskData(index, id, value);
    };

    const clickDeleteTimesheet = value => {
      //value = TimesheetID
      deleteTimesheetRow(index, id);
    };

    // If the initialValue is changed external, sync it up with our state
    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    if (
      id === "WorkStart" ||
      id === "MealStart" ||
      id === "MealEnd" ||
      id === "WorkEnd"
    ) {
      return (
        <div className={styles["table__time-wrapper"]}>
          <InputMask
            value={value.slice(0, 2)}
            onChange={onCheckHour}
            onBlur={onBlur}
            className={
              afterSundayCheck
                ? classNames(
                    "table__time-wrapper__target-disabled",
                    styles["table__time-wrapper__hour-input"]
                  )
                : classNames(
                    "table__time-wrapper__target-disabled",
                    styles["table__time-wrapper__hour-input-before-sunday"]
                  )
            }
            mask="29"
            placeholder="01~12"
            formatChars={{
              2: "[0-1]",
              9: "[0-9]",
            }}
            disabled={afterSundayCheck ? false : true}
          />
          :
          <InputMask
            value={value.slice(3, 5)}
            onChange={onCheckMin}
            onBlur={onBlur}
            className={
              afterSundayCheck
                ? classNames(
                    "table__time-wrapper__target-disabled",
                    styles["table__time-wrapper__min-input"]
                  )
                : classNames(
                    "table__time-wrapper__target-disabled",
                    styles["table__time-wrapper__min-input-before-sunday"]
                  )
            }
            placeholder="00~50"
            mask="50"
            formatChars={{
              5: "[0-5]",
            }}
            disabled={afterSundayCheck ? false : true}
          />
          <select
            value={value.slice(5, 7)}
            onChange={onCheckAmPm}
            onBlur={onBlur}
            className={classNames(
              "table__time-wrapper__target-disabled",
              styles["table__ampm-dropdown"]
            )}
            disabled={afterSundayCheck ? false : true}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      );
    } else if (id === "TimesheetID") {
      if (afterSundayCheck === true) {
        return (
          <DeleteForeverIcon
            color="action"
            className={styles["table__delete-icon"]}
            value={value}
            onClick={() => clickDeleteTimesheet(value)}
          ></DeleteForeverIcon>
        );
      } else return <></>;
    } else if (id === "EmployeeName") {
      return (
        <Autocomplete
          getItemValue={item => item.EmployeeName}
          items={dataEmployees}
          renderItem={(item, isHighlighted) => (
            <div
              key={item.EmployeeID}
              style={{
                background: isHighlighted ? "lightgray" : "white",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {item.EmployeeName}
            </div>
          )}
          shouldItemRender={(item, value) =>
            item.EmployeeName.toLowerCase().indexOf(value.toLowerCase()) > -1
          }
          value={value}
          onChange={onChange}
          inputProps={{ onBlur: onBlurForEmployee }}
          onSelect={val => onChangeSelectEmployee(val)}
          renderInput={props => {
            return (
              <input
                className={
                  afterSundayCheck
                    ? styles["table__employee-input"]
                    : styles["table__employee-input-before-sunday"]
                }
                disabled={afterSundayCheck ? false : true}
                {...props}
              ></input>
            );
          }}
        />
      );
    } else if (id === "Task") {
      return (
        <Autocomplete
          getItemValue={item => item.Name}
          items={dataTasks}
          renderItem={(item, isHighlighted) => (
            <div
              key={item.TaskID}
              style={{
                background: isHighlighted ? "lightgray" : "white",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {item.Name}
            </div>
          )}
          shouldItemRender={(item, value) =>
            item.Name.toLowerCase().indexOf(value.toLowerCase()) > -1
          }
          value={value}
          onChange={onChange}
          inputProps={{ onBlur: onBlurForTasks }}
          onSelect={val => onChangeSelectTasks(val)}
          renderInput={props => {
            return (
              <input
                className={
                  afterSundayCheck
                    ? styles["table__task-input"]
                    : styles["table__task-input-before-sunday"]
                }
                disabled={afterSundayCheck ? false : true}
                {...props}
              ></input>
            );
          }}
        />
      );
    } else if (id === "laborHours") {
      let laborDate = (
        (new Date(convertInputToTime(row.values.WorkEnd).replace(" ", "T")) -
          new Date(convertInputToTime(row.values.WorkStart).replace(" ", "T")) -
          (new Date(convertInputToTime(row.values.MealEnd).replace(" ", "T")) -
            new Date(
              convertInputToTime(row.values.MealStart).replace(" ", "T")
            ))) /
        3600000
      ).toFixed(2);
      if (parseFloat(laborDate) < 0) {
        laborDate = (parseFloat(laborDate) + 24).toFixed(2);
      }

      return (
        <div
          className={classNames([
            styles["table__labor-hours-input"],
            "table__labor-hours-input",
          ])}
        >
          {laborDate}
        </div>
      );
    }
  };

  // Set our editable cell renderer as the default Cell renderer
  const defaultColumn = {
    Cell: EditableCell,
  };

  // When our cell renderer calls updateMyData, we'll use
  // the rowIndex, columnId and new value to update the
  // original data
  const updateMyData = (rowIndex, columnId, value) => {
    // We also turn on the flag to not reset the page
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  const updateEmployeeData = (rowIndex, columnId, value) => {
    // We also turn on the flag to not reset the page
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
            ["EmployeeID"]: convertEmployeeNameToID(value),
          };
        }
        return row;
      })
    );
  };

  const updateTaskData = (rowIndex, columnId, value) => {
    // We also turn on the flag to not reset the page
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
            ["TaskID"]: convertTaskNameToID(value),
          };
        }
        return row;
      })
    );
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

  const convertTaskNameToID = name => {
    let task = dataTasks.find(task => name === task.Name);
    if (task) {
      return task.TaskID;
    } else {
      return 0;
    }
  };

  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        defaultColumn,
        updateMyData,
      },
      useBlockLayout
    );
  // Render the UI for your table

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
          if (result.data.result[0].length === 0) {
            setCheckState(true);
          } else {
            setCheckState(false);
          }
          setData(result.data.result[0]);
          dataEmployees = result.data.result[1];
          dataTasks = result.data.result[2];
        });
      }
    };
    promises.push(fetchData());
    trackPromise(Promise.all(promises).then(() => {}));
  }, [projectState, status, selectedDate, router.isReady]);

  useEffect(() => {
    if (checkState) {
      for (
        let i = 12;
        i <
        document.getElementsByClassName("table__time-wrapper__target-disabled")
          .length;
        i++
      ) {
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].setAttribute("disabled", true);
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].classList.add("table__time-wrapper__target-disabled--disabled");
      }
    } else {
      for (
        let i = 12;
        i <
        document.getElementsByClassName("table__time-wrapper__target-disabled")
          .length;
        i++
      ) {
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].removeAttribute("disabled");
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].classList.remove(
            "table__time-wrapper__target-disabled--disabled"
          );
      }
    }
  }, [data]);

  const handleSaveTimesheetBtn = async () => {
    let checkEmployeeName = data.find(employee => employee.EmployeeID === 0);
    let checkTime = 0;
    for (
      let i = 0;
      i < document.getElementsByClassName("table__labor-hours-input").length;
      i++
    ) {
      if (
        document.getElementsByClassName("table__labor-hours-input")[i]
          .innerText === "NaN"
      )
        checkTime++;
    }
    if (checkEmployeeName) {
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
    } else if (checkTime) {
      toast.error(
        <div className={styles["alert__table__time-wrapper"]}>
          Unable to save. <br /> Please check the <strong>time input </strong>.
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }

    await axios({
      method: "delete",
      url: `/api/timesheets`,
      timeout: 3000, // 3 seconds timeout
      headers: {},
      data: {
        ProjectID: projectState,
        Date: formatDate(selectedDate),
      },
    });

    data.forEach(async element => {
      await axios({
        method: "post",
        url: `/api/timesheets`,
        timeout: 3000, // 3 seconds timeout
        headers: {},
        data: {
          ProjectID: projectState,
          EmployeeID: element.EmployeeID,
          Date: formatDate(selectedDate),
          WorkStart: element.WorkStart,
          WorkEnd: element.WorkEnd,
          MealStart: element.MealStart,
          MealEnd: element.MealEnd,
        },
      }).catch(err => {
        toast.error(
          <div className={styles["alert__complete"]}>
            <strong>CANNOT SAVE</strong>
            <p>Please check the time input.</p>
          </div>,
          {
            position: toast.POSITION.TOP_CENTER,
            hideProgressBar: true,
          }
        );
      });
    });

    toast.success(
      <div className={styles["alert__complete"]}>
        <strong>Save Complete</strong>
      </div>,
      {
        position: toast.POSITION.BOTTOM_CENTER,
        hideProgressBar: true,
      }
    );

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

  const addTimesheetRow = () => {
    setData([
      ...data,
      {
        TimesheetID: 0,
        EmployeeID: 0,
        EmployeeName: "",
        Date: formatDate(selectedDate),
        Task: "",
        WorkStart: data[0] !== undefined ? data[0].WorkStart : "07:00AM",
        MealStart: data[0] !== undefined ? data[0].MealStart : "12:00PM",
        MealEnd: data[0] !== undefined ? data[0].MealEnd : "01:00PM",
        WorkEnd: data[0] !== undefined ? data[0].WorkEnd : "04:00PM",
      },
    ]);
  };

  const checkChange = event => {
    if (event.target.checked) {
      for (
        let i = 12;
        i <
        document.getElementsByClassName("table__time-wrapper__target-disabled")
          .length;
        i++
      ) {
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].setAttribute("disabled", true);
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].classList.add("table__time-wrapper__target-disabled--disabled");
      }
      setSameTime();
    } else {
      for (
        let i = 12;
        i <
        document.getElementsByClassName("table__time-wrapper__target-disabled")
          .length;
        i++
      ) {
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].removeAttribute("disabled");
        document
          .getElementsByClassName("table__time-wrapper__target-disabled")
          [i].classList.remove(
            "table__time-wrapper__target-disabled--disabled"
          );
      }
    }
    setCheckState(event.target.checked);
  };

  const deleteTimesheetRow = (rowIndex, columnId) => {
    setData(old =>
      old.filter((row, index) => {
        return index !== rowIndex;
      })
    );
  };

  const setSameTime = () => {
    setData(old =>
      old.map((row, index) => {
        return {
          ...old[index],
          WorkStart: old[0].WorkStart,
          MealStart: old[0].MealStart,
          MealEnd: old[0].MealEnd,
          WorkEnd: old[0].WorkEnd,
        };
      })
    );
  };

  return (
    <>
      {console.log(data)}
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
      ) : !status.permission ? (
        <NotPermission path="timesheet" />
      ) : (
        <>
          <MainTab
            tapNo={3}
            main={false}
            employeeID={status.cookies.employeeid}
            employeeName={status.cookies.fullname}
            logout={logout}
            projectState={router.query.pid}
          />
          <div id={styles.mainDiv}>
            {promiseInProgress ? (
              <div
                style={{
                  width: "100%",
                  height: "100",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Loader
                  type="Circles"
                  color="#faea06"
                  height="130"
                  width="130"
                />
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
                        marginBottom: "3px",
                        fontFamily: "Roboto, sans-serif",
                        fontSize: "medium",
                        display: "inline-block",
                        color: "#74646e",
                        border: "1px solid #c8bfc4",
                        borderRadius: "4px",
                        boxShadow: "inset 1px 1px 2px #ddd8dc",
                        background: "#fff",
                        zIndex: "1",
                        position: "relative",
                        maxWidth: "600px",
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
                            {item.ProjectID} &emsp;[{item.ProjectGroup}]&ensp;
                            {item.ProjectName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className={styles["header__right"]}>
                    {/* {dateCheckEditable(selectedDate) && ( */}
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
                        onClick={handleSaveTimesheetBtn}
                        startIcon={<SaveIcon />}
                      >
                        Save
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        className={
                          dateCheckEditable(selectedDate)
                            ? styles["header__right__add-btn"]
                            : styles["header__right__add-btn-before-sunday"]
                        }
                        onClick={addTimesheetRow}
                        startIcon={<AddIcon />}
                      >
                        Add&nbsp;Row
                      </Button>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checkState}
                            onChange={checkChange}
                            name="checkbox"
                            color="secondary"
                            id="checkboxForSetSameTime"
                          />
                        }
                        label="Set Same Time of All"
                        className={
                          dateCheckEditable(selectedDate)
                            ? styles["header__right__checkbox"]
                            : styles["header__right__checkbox-before-sunday"]
                        }
                      />
                    </>
                    {/* )} */}
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
                    <p className={styles["header__right__label-date-picker"]}>
                      Date
                    </p>
                  </div>
                </div>
                <div className={styles["table"]}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        {headerGroups.map(headerGroup => (
                          <TableRow {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                              <TableCell {...column.getHeaderProps()}>
                                {column.render("Header")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableHead>
                      <TableBody>
                        {rows.map((row, i) => {
                          prepareRow(row);
                          return (
                            <TableRow {...row.getRowProps()}>
                              {row.cells.map(cell => {
                                return (
                                  <TableCell {...cell.getCellProps()}>
                                    {cell.render("Cell")}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Timesheet;
