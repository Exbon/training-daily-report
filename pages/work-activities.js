import { useState, useMemo, useEffect } from "react";
import { CookiesProvider, useCookies } from "react-cookie";
import axios from "axios";
import Router, { useRouter } from "next/router";
import Head from "next/head";
import SimpleTabs from "../components/MainTab/MainTab";
import NotPermission from "../components/MainTab/NotPermission";
import { usePromiseTracker, trackPromise } from "react-promise-tracker";
import Loader from "react-loader-spinner";
import Login from "../components/MainTab/login.js";
import { useTable, useBlockLayout } from "react-table";
import styles from "./WorkActivities.module.css";
import SaveIcon from "@material-ui/icons/Save";
import DateFnsUtils from "@date-io/date-fns";
import Button from "@material-ui/core/Button";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { formatDate } from "../components/main/formatDate";

import TextField from "@material-ui/core/TextField";
import DeleteTwoTone from "@material-ui/icons/DeleteTwoTone";

import Autocomplete from "react-autocomplete";

import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

import DescriptionIcon from "@material-ui/icons/Description";
import { RiFileExcel2Fill } from "react-icons/ri";
import { FaFilePdf } from "react-icons/fa";
import InputMask from "react-input-mask";
import { useMediaQuery } from "react-responsive";

toast.configure();
let dataContractor = [{ Name: "" }];
const materialTheme = createMuiTheme({
  palette: {
    primary: {
      main: "#3E3F42",
    },
  },
  overrides: {
    MuiPickersCalendarHeader: {
      switchHeader: {
        backgroundColor: "#303235",
        color: "white",
      },
      iconButton: {
        backgroundColor: "transparent",
        color: "white",
      },
      dayLabel: {
        color: "white", //days in calendar
      },
      transitionContainer: {
        color: "white",
      },
    },
    MuiPickersBasePicker: {
      pickerView: {
        backgroundColor: "#3E3F42",
      },
    },
    MuiPickersDay: {
      day: {
        color: "white", //days in calendar
      },
      daySelected: {
        backgroundColor: "#FFC561", //calendar circle
        color: "black",
      },
      current: {
        backgroundColor: "#736F69",
        color: "white",
      },
    },

    MuiDialogActions: {
      root: {
        backgroundColor: "#3E3F42",
      },
    },
  },
});

const workActivities = () => {
  const router = useRouter();
  const [projectState, setProjectState] = useState(undefined);
  const [stateAssignedProject, setStateAssignedProject] = useState([
    { ProjectID: 0 },
  ]);
  const [stateNoAssigned, setStateNoAssigned] = useState([]);
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
  const [data, setData] = useState(() => []);
  const [activity, setActivity] = useState(() => []);
  const [selectedDate, handleDateChange] = useState(new Date());
  const [checkDownload, setCheckDownload] = useState(0);
  const { promiseInProgress } = usePromiseTracker();

  const resolution1008 = useMediaQuery({
    maxWidth: "1008px",
    minWidth: "712px",
  });

  const columns = React.useMemo(
    () => [
      {
        Header: "Contractor",
        accessor: "Contractor",
        width: resolution1008 ? 180 : 220,
      },
      {
        Header: "Trade",
        accessor: "Trade",
        width: resolution1008 ? 200 : 250,
      },
      {
        Header: "Manpower",
        width: 160,
        columns: [
          {
            Header: "No. of Workers",
            accessor: "Workers",
            width: 80,
          },
          {
            Header: "Hours /Day",
            accessor: "Hours",
            width: 80,
          },
        ],
      },
      {
        Header: "Equipment Utilization",
        accessor: "Equipment",
        width: resolution1008 ? 170 : 203,
      },
      {
        Header: "Work Performed",
        accessor: "WorkPerformed",
        width: resolution1008 ? 220 : 260,
      },
      {
        Header: "",
        accessor: "isDeleted",
        width: 37,
      },
    ],
    []
  );

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

  const EditableCell = ({
    value: initialValue,
    row: { index },
    column: { id },
    updateMyData, // This is a custom function that we supplied to our table instance
  }) => {
    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue);

    const onChange = e => {
      setValue(e.target.value);
      updateMyData(index, id, e.target.value);
    };

    // We'll only update the external data when the input is blurred
    const onBlur = () => {
      updateMyData(index, id, value);
    };

    // If the initialValue is changed external, sync it up with our state
    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    //         Contractor: "TEST Contractor",
    //         WorkActivity: "TEST WorkActivity",
    //         Super: 15.5,
    //         Labor: 10.5,
    //         Equipment: "TEST Equipment",
    //         WorkPerformed: "TEST Work Performed", isDeleted: 0,

    const onBlurForContractor = e => {
      updateContractorData(index, id, value);
    };

    const onChangeSelect = value => {
      setValue(value);
      updateContractorData(index, id, value);
    };

    if (id === "Contractor") {
      return (
        <Autocomplete
          getItemValue={item => item.Name}
          items={dataContractor}
          renderItem={(item, isHighlighted) => (
            <div
              key={item.Name}
              style={{
                background: isHighlighted ? "lightgray" : "white",
              }}
            >
              {item.Name}
            </div>
          )}
          shouldItemRender={(item, value) =>
            item.Name.toString()
              .toLowerCase()
              .indexOf(value.toString().toLowerCase()) > -1
          }
          value={value}
          onChange={onChange}
          inputProps={{ onBlur: onBlurForContractor }}
          onSelect={val => onChangeSelect(val)}
          renderInput={props => {
            return (
              <input
                className={styles["table__contractor__input"]}
                {...props}
              ></input>
            );
          }}
          // menuStyle={props => ({
          //   ...props,
          // })}
        />
      );

      /* <input
          className={styles["table__contractor__input"]}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        /> */
    } else if (id === "Trade") {
      return (
        <input
          className={styles["table__trade__input"]}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "Workers") {
      return (
        <input
          className={styles["table__workers__input"]}
          type="number"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "Hours") {
      return (
        <input
          className={styles["table__hours__input"]}
          type="number"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "Equipment") {
      return (
        <input
          className={styles["table__equipment__input"]}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "WorkPerformed") {
      return (
        <input
          className={styles["table__work-performed__input"]}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "isDeleted") {
      return (
        <DeleteTwoTone
          className={styles["table__is-deleted__icon"]}
          onClick={() => deleteActivityRow(index)}
        />
      );
    }
    return <input value={value} onChange={onChange} onBlur={onBlur} />;
  };

  const updateContractorData = (rowIndex, columnId, value) => {
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

  const addActivityRow = () => {
    if (data.length >= 8) {
      toast.warning(
        <div className={styles["alert__complete"]}>
          <strong style={{ marginBottom: "30px" }}>
            CANNOT ADD row more than 8
          </strong>
          <p style={{ marginBottom: "20px" }}>
            Please contact IT if you need to add more. (Hyunmyung Kim:
            201-554-6666)
          </p>
        </div>,
        {
          position: toast.POSITION.TOP_CENTER,
          hideProgressBar: true,
        }
      );
      return null;
    }
    setData(previous => [
      ...previous,
      {
        Contractor: "",
        Trade: "",
        Workers: 0,
        Hours: 0,
        Equipment: "",
        WorkPerformed: "",
        isDeleted: 0,
      },
    ]);
  };

  const deleteActivityRow = rowIndex => {
    setData(old =>
      old.filter((row, index) => {
        return index !== rowIndex;
      })
    );
  };

  // Set our editable cell renderer as the default Cell renderer
  const defaultColumn = {
    Cell: EditableCell,
  };

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

  const signin = async (username, password) => {
    await axios({
      method: "post",
      url: `/api/daily-report/signin`,
      timeout: 1000000, // 5 seconds timeout
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

  useEffect(() => {
    let promises = [];

    if (!router.isReady) return;
    const fetchData = async () => {
      if (status.cookies.username !== 0) {
        if (status.cookies.username !== undefined) {
          await axios({
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

      if (status.permission === true && projectState !== undefined) {
        router.push(`?pid=${projectState}`);
        await axios({
          method: "get",
          url: `/api/project-activity?projectID=${projectState}&selectedDate=${formatDate(
            selectedDate
          )}`,
          timeout: 1000000, // 5 seconds timeout
          headers: {},
        }).then(response => {
          setData(response.data.result[1]);
          if (response.data.result[0][0] !== undefined) {
            setActivity({
              Weather: response.data.result[0][0].Weather,
              StartTime: response.data.result[0][0].StartTime,
              EndTime: response.data.result[0][0].EndTime,
              Tests: response.data.result[0][0].Tests,
              Correctional: response.data.result[0][0].Correctional,
              Note: response.data.result[0][0].Note,
            });
          } else {
            setActivity({
              Weather: "",
              StartTime: "",
              EndTime: "",
              Tests: "",
              Correctional: "",
              Note: "",
            });
          }
          dataContractor = response.data.result[2];
          let SelectedDays = [];
          response.data.result[3].forEach(element => {
            SelectedDays.push(formatDate(element.Date));
          });
          setSelectedDays(SelectedDays);
          //changed
        });
      } else {
        setData([]);
        setActivity({
          Weather: "",
          StartTime: "",
          EndTime: "",
          Tests: "",
          Correctional: "",
          Note: "",
        });
      }
    };

    promises.push(fetchData());
    trackPromise(Promise.all(promises).then(() => {}));
  }, [projectState, status, selectedDate, router.isReady]);

  const [selectedDays, setSelectedDays] = useState([]);

  const handleExcelExport = async () => {
    setCheckDownload(1);
    const project_id = document.getElementById("project-state-id");

    const projectName =
      project_id.options[project_id.selectedIndex].getAttribute("projectname");

    const contractNo =
      project_id.options[project_id.selectedIndex].getAttribute("contractno");

    await axios({
      method: "POST",
      url: `/api/work-activities/export-excel`,
      timeout: 1000000,
      headers: {},
      data: {
        ProjectName: projectName,
        ProjectID: projectState,
        Date: formatDate(selectedDate),
        Weather: activity.Weather,
        StartTime: activity.StartTime,
        EndTime: activity.EndTime,
        Tests: activity.Tests,
        Correctional: activity.Correctional,
        Note: activity.Note,
        data: data,
        username: status.cookies.username,
        fullname: status.cookies.fullname,
        contractno: contractNo,
      },
    });

    setTimeout(() => {
      // setCheckDownload(0);
      document
        .getElementById("excelExport")
        .setAttribute(
          "href",
          "/Daily Report_" + status.cookies.username + ".xlsx"
        );
      document.getElementById("excelExport").click();
      setCheckDownload(0);
      toast.success(
        <div className={styles["alert__complete"]}>
          <strong>Download Complete</strong>
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
    }, 3000);
  };

  const handlePDFExport = async () => {
    setCheckDownload(1);
    const project_id = document.getElementById("project-state-id");

    const projectName =
      project_id.options[project_id.selectedIndex].getAttribute("projectname");

    const contractNo =
      project_id.options[project_id.selectedIndex].getAttribute("contractno");

    const totalWorkers = document.getElementById("total-workers-id").innerText;
    await axios({
      method: "POST",
      url: `/api/work-activities/export-pdf`,
      timeout: 1000000,
      headers: {},
      data: {
        ProjectName: projectName,
        ProjectID: projectState,
        Date: formatDate(selectedDate),
        Weather: activity.Weather,
        StartTime: activity.StartTime,
        EndTime: activity.EndTime,
        Tests: activity.Tests,
        Correctional: activity.Correctional,
        Note: activity.Note,
        data: data,
        username: status.cookies.username,
        fullname: status.cookies.fullname,
        contractno: contractNo,
        totalWorkers: totalWorkers,
      },
    });

    setTimeout(() => {
      // setCheckDownload(0);
      document
        .getElementById("pdfExport")
        .setAttribute(
          "href",
          "/Daily Report_" + status.cookies.username + ".pdf"
        );
      document.getElementById("pdfExport").click();
      setCheckDownload(0);
      toast.success(
        <div className={styles["alert__complete"]}>
          <strong>Download Complete</strong>
        </div>,
        {
          position: toast.POSITION.BOTTOM_CENTER,
          hideProgressBar: true,
        }
      );
    }, 3500);
  };

  const handleSaveBtn = async () => {
    // setCheckDownload(1);
    let promises = [];

    const fetchData = async () => {
      const editValue = {
        Tests: activity.Tests.replaceAll(`'`, `''`),
        Correctional: activity.Correctional.replaceAll(`'`, `''`),
        Note: activity.Note.replaceAll(`'`, `''`),
      };
      let AID = 0;

      await axios({
        method: "post",
        url: `/api/project-activity?`,
        timeout: 1000000, // 5 seconds timeout
        headers: {},
        /* --Params--
          	@projectID int,
            @date date,
            @weather nvarchar(50),
            @startTime time(0),
            @endTime time(0),
            @tests nvarchar(1000),
            @correctional nvarchar(1000),
            @note nvarchar(1000)
          */
        data: {
          ProjectID: projectState,
          Date: formatDate(selectedDate),
          Weather: activity.Weather,
          StartTime: activity.StartTime,
          EndTime: activity.EndTime,
          Tests: editValue.Tests,
          Correctional: editValue.Correctional,
          Note: editValue.Note,
        },
      }).then(response => {
        AID = response.data.ActivityID;
      });

      await axios({
        method: "delete",
        url: `/api/project-activity-item`,
        timeout: 1000000, // 5 seconds timeout
        headers: {},
        data: {
          ActivityID: AID,
        },
      });

      data.forEach(async element => {
        const editValue = {
          Contractor: element.Contractor.replaceAll(`'`, `''`),
          Trade: element.Trade.replaceAll(`'`, `''`),
          Equipment: element.Equipment.replaceAll(`'`, `''`),
          WorkPerformed: element.WorkPerformed.replaceAll(`'`, `''`),
        };
        await axios({
          method: "post",
          url: `/api/project-activity-item`,
          timeout: 1000000, // 5 seconds timeout
          headers: {},
          /* --Params--
          @activityID int,

          @contractor nvarchar(100),
          @trade nvarchar(100),
          @workers int,
          @hours float,
          @equipment nvarchar(100),
          @workPerformed nvarchar(300)
        */
          data: {
            ActivityID: AID,
            Contractor: editValue.Contractor,
            Trade: editValue.Trade,
            Workers: element.Workers,
            Hours: element.Hours,
            Equipment: editValue.Equipment,
            WorkPerformed: editValue.WorkPerformed,
          },
        });
      });
    };

    trackPromise(fetchData());
    // trackPromise(handleExport());

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

    axios({
      method: "post",
      url: `/api/log-daily-reports`,
      timeout: 1000000, // 5 seconds timeout
      headers: {},
      data: {
        EmployeeID: status.cookies.employeeid,
        ProjectID: projectState,
        Date: formatDate(selectedDate),
        Category: "Activity",
        Action: "update",
      },
    });
  };

  const handleChangeWeather = value => {
    setActivity(() => ({
      Weather: value,
      StartTime: activity.StartTime,
      EndTime: activity.EndTime,
      Tests: activity.Tests,
      Correctional: activity.Correctional,
      Note: activity.Note,
    }));
  };

  const handleChangeStartTime = value => {
    setActivity(() => ({
      Weather: activity.Weather,
      StartTime: value,
      EndTime: activity.EndTime,
      Tests: activity.Tests,
      Correctional: activity.Correctional,
      Note: activity.Note,
    }));
  };

  const handleChangeEndTime = value => {
    setActivity(() => ({
      Weather: activity.Weather,
      StartTime: activity.StartTime,
      EndTime: value,
      Tests: activity.Tests,
      Correctional: activity.Correctional,
      Note: activity.Note,
    }));
  };

  const handleChangeTests = value => {
    setActivity(() => ({
      Weather: activity.Weather,
      StartTime: activity.StartTime,
      EndTime: activity.EndTime,
      Tests: value,
      Correctional: activity.Correctional,
      Note: activity.Note,
    }));
  };

  const handleChangeCorrectional = value => {
    setActivity(() => ({
      Weather: activity.Weather,
      StartTime: activity.StartTime,
      EndTime: activity.EndTime,
      Tests: activity.Tests,
      Correctional: value,
      Note: activity.Note,
    }));
  };

  const handleChangeNote = value => {
    setActivity(() => ({
      Weather: activity.Weather,
      StartTime: activity.StartTime,
      EndTime: activity.EndTime,
      Tests: activity.Tests,
      Correctional: activity.Correctional,
      Note: value,
    }));
  };

  const totalWorkers = array => {
    let total = 0;
    array.forEach(element => (total += parseInt(element.Workers)));
    return total;
  };

  const checkStartTime = value => {
    if (
      parseInt(value.substring(0, 2)) > 12 ||
      parseInt(value.substring(0, 2)) == 0
    ) {
      toast.warning(
        <div className={styles["alert__complete"]}>
          <p style={{ marginBottom: "20px" }}>
            The hour input range is <strong>01 ~ 12 </strong> in Start Time.
            Please set AM or PM.
          </p>
        </div>,
        {
          position: toast.POSITION.TOP_CENTER,
          hideProgressBar: true,
        }
      );

      setActivity(() => ({
        Weather: activity.Weather,
        StartTime: "",
        EndTime: activity.EndTime,
        Tests: activity.Tests,
        Correctional: activity.Correctional,
        Note: activity.Note,
      }));
    }
  };

  const checkEndTime = value => {
    if (
      parseInt(value.substring(0, 2)) > 12 ||
      parseInt(value.substring(0, 2)) == 0
    ) {
      toast.warning(
        <div className={styles["alert__complete"]}>
          <p style={{ marginBottom: "20px" }}>
            The hour input range is <strong>01 ~ 12 </strong> in End Time.
            Please set AM or PM.
          </p>
        </div>,
        {
          position: toast.POSITION.TOP_CENTER,
          hideProgressBar: true,
        }
      );
      setActivity(() => ({
        Weather: activity.Weather,
        StartTime: activity.StartTime,
        EndTime: "",
        Tests: activity.Tests,
        Correctional: activity.Correctional,
        Note: activity.Note,
      }));
    }
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

  return (
    <>
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
        <NotPermission path="work-activities" />
      ) : (
        <>
          <SimpleTabs
            tapNo={1}
            projectState={projectState}
            main={false}
            employeeID={status.cookies.employeeid}
            employeeName={status.cookies.fullname}
            logout={logout}
          />
          {promiseInProgress || !projectState || checkDownload ? (
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
              <Loader type="Oval" color="#1ec996" height="150" width="150" />
            </div>
          ) : (
            <div id={styles.mainDiv}>
              <h1 className={styles["title"]}>Work Activities</h1>
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
                      zIndex: "1",
                      position: "relative",
                      maxWidth: "600px",
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
                      className={styles["header__right__date-picker"]}
                      value={selectedDate}
                      onChange={handleDateChange}
                      format="MM/dd/yyyy"
                      autoOk={true}
                      okLabel=""
                      renderDay={(
                        day,
                        selectedDate,
                        isInCurrentMonth,
                        dayComponent
                      ) => {
                        const isSelected =
                          isInCurrentMonth &&
                          selectedDays.includes(formatDate(day));

                        // You can also use our internal <Day /> component
                        return (
                          // <Badge badgeContent={isSelected ? "🌚" : undefined}>
                          //   {dayComponent}
                          // </Badge>
                          <div
                            style={
                              isSelected
                                ? {
                                    backgroundColor: "#61e2bb",
                                    borderRadius: "30%",
                                  }
                                : undefined
                            }
                          >
                            {dayComponent}
                          </div>
                        );
                      }}
                    />
                  </MuiPickersUtilsProvider>
                </div>
                <div className={styles["header__right"]}>
                  <Button
                    variant="contained"
                    size="small"
                    className={styles["header__right__pdf-export-btn"]}
                    startIcon={<FaFilePdf />}
                    onClick={handlePDFExport}
                    style={{ marginRight: "10px" }}
                  >
                    Export
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    className={styles["header__right__excel-export-btn"]}
                    startIcon={<RiFileExcel2Fill />}
                    onClick={handleExcelExport}
                    style={{ marginRight: "10px" }}
                  >
                    Export
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className={styles["header__right__save-btn"]}
                    startIcon={<SaveIcon />}
                    onClick={handleSaveBtn}
                  >
                    Save
                  </Button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "left",
                  marginTop: "18px",
                  marginBottom: "10px",
                  fontFamily: "Roboto",
                }}
                className={styles["before-table"]}
              >
                <p
                  style={{
                    marginTop: "4px",
                    marginBottom: "0px",
                    marginRight: "15px",
                    marginLeft: "3px",
                    fontFamily: "Roboto, sans-serif",
                    color: "#807b7d",
                    height: "30px",
                    alignSelf: "center",
                  }}
                >
                  Weather
                </p>
                <select
                  id="weatherID"
                  name="weatherName"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: "medium",
                    display: "inline-block",
                    color: "rgb(150, 146, 149)",
                    border: "1px solid #c8bfc4",
                    borderRadius: "4px",
                    boxShadow: "inset 1px 1px 2px #ddd8dc",
                    background: "#fff",
                    zIndex: "1",
                    position: "relative",
                    height: "1.5em",
                    marginTop: "15.5px",
                  }}
                  value={activity.Weather}
                  onChange={e => handleChangeWeather(e.target.value)}
                >
                  <option value="">Choose here</option>
                  <option value="Sunny">Sunny</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Partly Cloudy">Partly Cloudy</option>
                  <option value="Windy">Windy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Foggy">Foggy</option>
                  <option value="Snowy">Snowy</option>
                </select>
                <div style={{ marginLeft: "80px", display: "flex" }}>
                  <div style={{ display: "flex" }}>
                    <TextField
                      className={styles["table__start-time"]}
                      label="Start Time"
                      type="time"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 600, // 5 min
                      }}
                      style={{ marginBottom: "20px" }}
                      value={
                        activity.StartTime !== undefined
                          ? activity.StartTime
                          : "07:00"
                      }
                      onChange={e => handleChangeStartTime(e.target.value)}
                    />
                  </div>
                  <div style={{ marginLeft: "20px" }}>
                    <TextField
                      className={styles["table__end-time"]}
                      label="End Time"
                      type="time"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 600, // 10 min
                      }}
                      style={{ marginBottom: "10px" }}
                      value={
                        activity.EndTime !== undefined
                          ? activity.EndTime
                          : "17:00"
                      }
                      onChange={e => handleChangeEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className={styles["table"]}>
                <table {...getTableProps()}>
                  <thead>
                    {headerGroups.map((headerGroup, i) => (
                      <tr {...headerGroup.getHeaderGroupProps()} key={i}>
                        {headerGroup.headers.map((column, j) => (
                          <th {...column.getHeaderProps()}>
                            {column.render("Header")}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody {...getTableBodyProps()}>
                    {rows.map(row => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
                          {row.cells.map((cell, j) => {
                            return (
                              <td {...cell.getCellProps()}>
                                {cell.render("Cell")}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr className={styles["table__add-row"]}>
                      <td
                        className={styles["table__button-add"]}
                        onClick={addActivityRow}
                      >
                        (+) ADD
                      </td>
                      <td className={styles["table__trade-column"]}></td>
                      <td className={styles["table__worker-column"]}>
                        <div>Total</div>
                        <div id="total-workers-id">{totalWorkers(data)}</div>
                      </td>
                      <td className={styles["table__hours-column"]}></td>
                      <td className={styles["table__equipment-column"]}></td>
                      <td className={styles["table__perform-column"]}></td>
                      <td className={styles["table__delete-column"]}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <TextField
                  label="TESTS & INSPECTIONS"
                  multiline
                  rows={3}
                  fullWidth
                  margin="normal"
                  InputProps={{ style: { color: "#888484" } }}
                  InputLabelProps={{
                    shrink: true,
                    style: {
                      fontWeight: 1000,
                      fontSize: "1.2rem",
                      color: "#1bb486",
                    },
                  }}
                  variant="outlined"
                  style={{
                    backgroundColor: "#ececf5",
                    width: "99%",
                    marginLeft: "8px",
                  }}
                  value={activity.Tests !== undefined ? activity.Tests : ""}
                  onChange={e => handleChangeTests(e.target.value)}
                />
                <TextField
                  label="CORRECTIONAL ITEMS"
                  multiline
                  rows={3}
                  fullWidth
                  margin="normal"
                  InputProps={{ style: { color: "#888484" } }}
                  InputLabelProps={{
                    shrink: true,
                    style: {
                      fontWeight: 1000,
                      fontSize: "1.2rem",
                      color: "#1bb486",
                    },
                  }}
                  variant="outlined"
                  style={{
                    backgroundColor: "#ececf5",
                    marginLeft: "8px",
                    width: "99%",
                  }}
                  value={
                    activity.Correctional !== undefined
                      ? activity.Correctional
                      : ""
                  }
                  onChange={e => handleChangeCorrectional(e.target.value)}
                />
                <TextField
                  label="NOTE"
                  multiline
                  rows={3}
                  fullWidth
                  margin="normal"
                  InputProps={{ style: { color: "#888484" } }}
                  InputLabelProps={{
                    shrink: true,
                    style: {
                      fontWeight: 1000,
                      fontSize: "1.2rem",
                      color: "#1bb486",
                    },
                  }}
                  variant="outlined"
                  style={{
                    backgroundColor: "#ececf5",
                    marginLeft: "8px",
                    width: "99%",
                  }}
                  value={activity.Note !== undefined ? activity.Note : ""}
                  onChange={e => handleChangeNote(e.target.value)}
                />
              </div>
            </div>
          )}
        </>
      )}
      <a
        id="excelExport"
        href="/export.xlsx"
        download
        style={{ display: "none" }}
      >
        download
      </a>
      <a id="pdfExport" href="/export.pdf" download style={{ display: "none" }}>
        download
      </a>
    </>
  );
};

export default workActivities;
