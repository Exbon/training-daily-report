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
  const [stateAssignedProject, setStateAssignedProject] = useState([]);
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

  const columns = React.useMemo(
    () => [
      {
        Header: "Contractor",
        accessor: "Contractor",
        width: 220,
      },
      {
        Header: "Work Activities",
        accessor: "WorkActivity",
        width: 250,
      },
      {
        Header: "Manpower",
        width: 160,
        columns: [
          {
            Header: "Super",
            accessor: "Super",
            width: 80,
          },
          {
            Header: "Labor",
            accessor: "Labor",
            width: 80,
          },
        ],
      },
      {
        Header: "Equipment Utilization",
        accessor: "Equipment",
        width: 203,
      },
      {
        Header: "Work Performed",
        accessor: "WorkPerformed",
        width: 260,
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

    if (id === "Contractor") {
      return (
        <input
          className={styles["table__contractor__input"]}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "WorkActivity") {
      return (
        <input
          className={styles["table__work-activity__input"]}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "Super") {
      return (
        <input
          className={styles["table__super__input"]}
          type="number"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    } else if (id === "Labor") {
      return (
        <input
          className={styles["table__labor__input"]}
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

  const addActivityRow = () => {
    setData(previous => [
      ...previous,
      {
        Contractor: "",
        WorkActivity: "",
        Super: 0,
        Labor: 0,
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

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
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
          console.log(response.data.result[0]);
          if (response.data.result[0][0] !== undefined) {
            setActivity({
              Delivery: response.data.result[0][0].Delivery,
              Problems: response.data.result[0][0].Problems,
              Unforeseen: response.data.result[0][0].Unforeseen,
            });
          } else {
            setActivity({
              Delivery: "",
              Problems: "",
              Unforeseen: "",
            });
          }
        });
        // setData([
        //   {
        //     id: 1,
        //     Contractor: "TEST Contractor 1",
        //     WorkActivity: "TEST WorkActivity 1",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 1",
        //     WorkPerformed: "TEST Work Performed 1",
        //     isDeleted: 0,
        //   },
        //   {
        //     id: 2,
        //     Contractor: "TEST Contractor 2",
        //     WorkActivity: "TEST WorkActivity 2",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 2",
        //     WorkPerformed: "TEST Work Performed 2",
        //     isDeleted: 0,
        //   },
        //   {
        //     id: 3,
        //     Contractor: "TEST Contractor 3",
        //     WorkActivity: "TEST WorkActivity 3",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 3",
        //     WorkPerformed: "TEST Work Performed 3",
        //     isDeleted: 0,
        //   },
        //   {
        //     id: 4,
        //     Contractor: "TEST Contractor 4",
        //     WorkActivity: "TEST WorkActivity 4",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 4",
        //     WorkPerformed: "TEST Work Performed 4",
        //     isDeleted: 0,
        //   },
        //   {
        //     id: 5,
        //     Contractor: "TEST Contractor 5",
        //     WorkActivity: "TEST WorkActivity 5",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 5",
        //     WorkPerformed: "TEST Work Performed 5",
        //     isDeleted: 0,
        //   },
        //   {
        //     id: 6,
        //     Contractor: "TEST Contractor 6",
        //     WorkActivity: "TEST WorkActivity 6",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 7",
        //     WorkPerformed: "TEST Work Performed 7",
        //     isDeleted: 0,
        //   },

        //   {
        //     id: 7,
        //     Contractor: "TEST Contractor 8",
        //     WorkActivity: "TEST WorkActivity 8",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 8",
        //     WorkPerformed: "TEST Work Performed 8",
        //     isDeleted: 0,
        //   },
        //   {
        //     id: 8,
        //     Contractor: "TEST Contractor 9",
        //     WorkActivity: "TEST WorkActivity 9",
        //     Super: 15.5,
        //     Labor: 10.5,
        //     Equipment: "TEST Equipment 9",
        //     WorkPerformed: "TEST Work Performed 9",
        //     isDeleted: 0,
        //   },
        // ]);
      } else {
        setData([]);
        setActivity({
          Delivery: "",
          Problems: "",
          Unforeseen: "",
        });
      }
    };

    promises.push(fetchData());
    trackPromise(Promise.all(promises).then(() => {}));
  }, [projectState, status, selectedDate, router.isReady]);

  const [selectedDays, setSelectedDays] = useState([
    "04/10/2021",
    "03/10/2021",
  ]);

  const handleSaveBtn = async () => {
    await axios({
      method: "post",
      url: `/api/project-activity?`,
      timeout: 1000000, // 5 seconds timeout
      headers: {},
      /* --Params--
          	@projectID int,
            @date date,
            @delivery nvarchar(1000),
            @problems nvarchar(1000),
            @unforeseen nvarchar(1000)
          */
      data: {
        ProjectID: projectState,
        Date: selectedDate,
        Delivery: activity.Delivery,
        Problems: activity.Problems,
        Unforeseen: activity.Unforeseen,
      },
    });
  };

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
          <div id={styles.mainDiv}>
            <h1 className={styles["title"]}>Work Activities</h1>
            <div className={styles["header"]}>
              <div className={styles["header__left"]}>
                <select
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
                  }}
                >
                  {stateAssignedProject.map(item => {
                    return (
                      <option
                        value={item.ProjectID}
                        key={item.ProjectID}
                        projectgroup={item.ProjectGroup}
                        projectname={item.ProjectName}
                      >
                        {item.ProjectID} &emsp;[{item.ProjectGroup}]&ensp;
                        {item.ProjectName}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className={styles["header__right"]}>
                <p className={styles["header__right__label-date-picker"]}>
                  Date
                </p>
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
                                  borderRadius: "1000px",
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
                  {rows.map((row, i) => {
                    prepareRow(row);
                    if (i == rows.length - 1) {
                      return (
                        <React.Fragment key={i}>
                          <tr {...row.getRowProps()}>
                            {console.log({ ...row.getRowProps() })}
                            {row.cells.map((cell, j) => {
                              return (
                                <td {...cell.getCellProps()}>
                                  {console.log({ ...cell.getCellProps() })}
                                  {cell.render("Cell")}
                                </td>
                              );
                            })}
                          </tr>
                          <tr {...row.getRowProps()}>
                            {row.cells.map((cell, j) => {
                              return (
                                <td {...cell.getCellProps()}>
                                  <div
                                    className={styles["table__button-add"]}
                                    onClick={addActivityRow}
                                  >
                                    {j === 0 ? "(+) ADD" : ""}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    } else {
                      return (
                        <React.Fragment key={i}>
                          <tr {...row.getRowProps()}>
                            {row.cells.map((cell, j) => {
                              return (
                                <td {...cell.getCellProps()}>
                                  {cell.render("Cell")}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    }
                  })}
                  {rows.length === 0 && (
                    <tr style={{ display: "flex", width: "1130px" }}>
                      <td
                        className={styles["table__button-add"]}
                        style={{
                          boxSizing: "border-box",
                          display: "inline-block",
                          width: "220px",
                        }}
                        onClick={addActivityRow}
                      >
                        (+) ADD
                      </td>
                      <td
                        style={{
                          boxSizing: "border-box",
                          display: "inline-block",
                          width: "250px",
                        }}
                      ></td>
                      <td
                        style={{
                          boxSizing: "border-box",
                          display: "inline-block",
                          width: "80px",
                        }}
                      ></td>
                      <td
                        style={{
                          boxSizing: "border-box",
                          display: "inline-block",
                          width: "80px",
                        }}
                      ></td>
                      <td
                        style={{
                          boxSizing: "border-box",
                          display: "inline-block",
                          width: "203px",
                        }}
                      ></td>
                      <td
                        style={{
                          boxSizing: "border-box",
                          display: "inline-block",
                          width: "260px",
                        }}
                      ></td>
                      <td
                        style={{
                          boxSizing: "border-box",
                          display: "inline-block",
                          width: "37px",
                        }}
                      ></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <TextField
                id="delivery-input"
                value={activity.Delivery}
                label="Delivery Pick-up"
                style={{ margin: 8 }}
                fullWidth
                margin="normal"
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
              />
              <TextField
                id="problems-input"
                value={activity.Problems}
                label="Potential Problems"
                style={{ margin: 8 }}
                fullWidth
                margin="normal"
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
              />
              <TextField
                id="unforeseen-input"
                value={activity.Unforeseen}
                label="Unforeseen Condition"
                style={{ margin: 8 }}
                fullWidth
                margin="normal"
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
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default workActivities;
