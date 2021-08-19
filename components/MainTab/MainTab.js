import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Router from "next/router";
import AccountCircle from "@material-ui/icons/AccountCircle";
import styles from "./MainTab.module.css";
import { Button } from "@material-ui/core";
import Popover from "@material-ui/core/Popover";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import EventIcon from "@material-ui/icons/Event";
import Link from "next/link";

const MainTab = ({
  tapNo,
  projectState,
  main,
  employeeID,
  employeeName,
  logout,
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;
  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSchedule = () => {
    window.open(
      `${location.protocol}//${location.host}/calendar/${employeeID}`
    );
  };
  const handleLogout = () => {
    logout();
  };
  return (
    <AppBar position="static">
      <Tabs value={tapNo}>
        <Link
          href={
            projectState
              ? `/task-completion?pid=${projectState}`
              : "/task-completion"
          }
        >
          <Tab
            label={main ? "" : "Task Completion"}
            // onClick={() => Router.push(`/task-completion/${projectState}`)}
            disableRipple={true}
            disabled={main}
            textColor={tapNo === 0 ? "inherit" : "primary"}
          />
        </Link>
        {/* <Link
          href={
            projectState
              ? `/work-activities?pid=${projectState}`
              : "/work-activities"
          }
        >
          <Tab
            label={main ? "" : "Work Activities"}
            // onClick={() => Router.push(`/task-completion/${projectState}`)}
            disableRipple={true}
            disabled={main}
            textColor={tapNo === 1 ? "inherit" : "primary"}
          />
        </Link> */}
        {/* <Link href={`/self-timesheet?prevPid=${projectState}`}>
          <Tab
            label={main ? "" : "Self Timesheet"}
            // onClick={() => Router.push(`/timesheet/${projectState}`)}
            disableRipple={true}
            disabled={main}
            textColor={tapNo === 2 ? "inherit" : "primary"}
          />
        </Link> */}
        <Link
          href={projectState ? `/timesheet?pid=${projectState}` : "/timesheet"}
        >
          <Tab
            label={main ? "" : "Timesheet"}
            // onClick={() => Router.push(`/timesheet/${projectState}`)}
            disableRipple={true}
            disabled={main}
            textColor={tapNo === 2 ? "inherit" : "primary"}
          />
        </Link>
        {/* <Link href={`/deficiency-log/${projectState}`}>
          <Tab
            label={main ? "" : "Deficiency Log"}
            // onClick={() => Router.push(`/deficiency-log/${projectState}`)}
            disableRipple={true}
            disabled={main}
          />
        </Link> */}
        <Tab
          icon={
            <div className={styles["wrapper-right-tab"]}>
              <p className={styles["wrapper-right-tab__employee-name"]}>
                {/* {employeeInfo.FullName} */}
                {employeeName}
              </p>
              <AccountCircle
                className={styles["wrapper-right-tab__account-icon"]}
              />
            </div>
          }
          className={styles["right-tab"]}
          aria-describedby={id}
          onClick={handleClick}
          disableRipple={true}
        />
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        >
          <div className={styles["wrapper-schedule"]} onClick={handleSchedule}>
            <EventIcon />
            &emsp;
            <Button className={styles["wrapper-schedule__btn"]}>
              Schedule
            </Button>
          </div>
          <div className={styles["wrapper-logout"]} onClick={handleLogout}>
            <ExitToAppIcon />
            &emsp;
            <Button className={styles["wrapper-logout__btn"]}>Logout</Button>
          </div>
        </Popover>
      </Tabs>
    </AppBar>
  );
};

export default MainTab;
