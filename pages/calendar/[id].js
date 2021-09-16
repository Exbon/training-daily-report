import React from "react";
import { useRouter } from "next/router";
import { useState, useMemo, useEffect } from "react";
import styles from "./calendar.module.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import ReactTooltip from "react-tooltip";
import { usePromiseTracker, trackPromise } from "react-promise-tracker";
import Loader from "react-loader-spinner";
import axios from "axios";
import { formatDate } from "../../components/main/formatDate";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import AccountCircle from "@material-ui/icons/AccountCircle";
import Head from "next/head";

const calendar = () => {
  const handleEventPositioned = info => {
    info.el.setAttribute(
      "data-tip",
      "Job Number : " +
        info.event._def.extendedProps.JobNumber +
        "<br/>" +
        "Project Group : " +
        info.event._def.extendedProps.ProjectGroup +
        "<br/>" +
        "Project Name : " +
        info.event._def.extendedProps.ProjectName +
        "<br/>" +
        "Position : " +
        info.event._def.extendedProps.EmployeePosition +
        "<br/>" +
        "Start Date : " +
        formatDate(info.event._instance.range.start) +
        "<br/>" +
        "End Date : " +
        formatDate(info.event._instance.range.end) +
        "<br/>" +
        "Status : " +
        info.event._def.extendedProps.Status
    );

    ReactTooltip.rebuild();
  };
  const [data, setData] = useState(() => []);
  const router = useRouter();
  const { query = {} } = router || {};
  const { id = 0 } = query || {};

  useEffect(() => {
    const fetchData = async () => {
      let result = await axios({
        method: "get",
        url: `/api/calendar/${id}`,
        timeout: 15000, // 15 seconds timeout
        headers: {},
      });
      setData(result.data);
    };
    trackPromise(fetchData());
  }, [id]);

  const { promiseInProgress } = usePromiseTracker();

  return (
    <>
      <Head>
        <title>Schedule Calendar</title>
        <link rel="icon" href="/calendar.ico" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <AppBar position="static">
        <Toolbar>
          <div className={styles["toolbar__wrapper"]}>
            <div className={styles["toolbar__wrapper__left"]}>
              <Typography variant="h5">Schedule Calendar</Typography>
            </div>
            <div className={styles["toolbar__wrapper__right"]}>
              <Typography variant="h6">
                {typeof data[0] === "object" ? data[0].EmployeeName : ""}
              </Typography>
              <AccountCircle
                className={styles["toolbar__wrapper__right__account-icon"]}
              />
            </div>
          </div>
        </Toolbar>
      </AppBar>
      <div className={styles["frame"]}>
        {promiseInProgress || id === 0 ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Loader type="Oval" color="#FAC863" height="100" width="100" />
          </div>
        ) : (
          <>
            <FullCalendar
              plugins={[dayGridPlugin]}
              height="100%"
              initialView="dayGridMonth"
              events={data}
              dayMaxEventRows={100}
              eventColor="white"
              eventTextColor="white"
              displayEventTime={false}
              eventDidMount={handleEventPositioned}
            />
            <ReactTooltip
              class={styles["tooltip"]}
              multiline={true}
              type="info"
              offset={{ top: 10 }}
            />
          </>
        )}
      </div>
    </>
  );
};

// export async function getStaticPaths() {
//   return {
//     paths: [{ params: { id: "*" } }],
//     fallback: true,
//   };
// }

// export async function getStaticProps(context) {
//   // const res = await fetch("https://.../posts");
//   // const posts = await res.json();

//   const res = await fetch(
//     `http://localhost:3001/api/calendar/${context.params.id}`
//   );
//   const result = await res.json();

//   // let res;
//   // const fetchData = async () => {
//   //   let result = await axios({
//   //     method: "get",
//   //     url: `/api/calendar/${context.params.id}`,
//   //     timeout: 15000, // 15 seconds timeout
//   //     headers: {},
//   //   });
//   //   res = result.data;
//   // };
//   // fetchData();

//   return {
//     props: {
//       result,
//     },
//     // Next.js will attempt to re-generate the page:
//     // - When a request comes in
//     // - At most once every second
//     revalidate: 1, // In seconds
//   };
// }

export default calendar;
