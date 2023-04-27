"use client";

require("../polyfill");

import { useState, useEffect, StyleHTMLAttributes } from "react";

import styles from "./home.module.scss";
import { validUser } from "../requests";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";
import { Chat } from "./chat";

import dynamic from "next/dynamic";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"]:not([media])',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--themeColor");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

function WideScreen() {
  const config = useAppConfig();

  return (
    <div
      className={`${
        config.tightBorder ? styles["tight-container"] : styles.container
      }`}
    >
      <SideBar />

      <div className={styles["window-content"]}>
        <Routes>
          <Route path={Path.Home} element={<Chat />} />
          <Route path={Path.Chat} element={<Chat />} />
          <Route path={Path.Settings} element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

function MobileScreen() {
  const location = useLocation();
  const isHome = location.pathname === Path.Home;

  return (
    <div className={styles.container}>
      <SideBar className={isHome ? styles["sidebar-show"] : ""} />

      <div className={styles["window-content"]}>
        <Routes>
          <Route path={Path.Home} element={null} />
          <Route path={Path.Chat} element={<Chat />} />
          <Route path={Path.Settings} element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export function Home() {
  const isMobileScreen = useMobileScreen();
  useSwitchTheme();

  const [isAllow, setIsAllow] = useState(false); // 白名单状态
  const [isRequestErr, setIsRequestErr] = useState(false); // 接口报错状态
  const [isLoading, setIsLoading] = useState(false);
  const [isNotInLan, setIsNotInLan] = useState(false); // 不在内网

  useEffect(() => {
    getBaseInfo();
  }, []);

  const getBaseInfo = async () => {
    setIsLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const signature = urlParams.get("signature") || "";
    // 是否在白名单
    const response = await validUser(signature);
    const { data, error } = response;
    console.log({ data, error });
    if (error) {
      setIsAllow(false);
      setIsRequestErr(true);
      console.error(error);
    } else {
      const { code, msg } = data;
      setIsAllow(code === 0);
      setIsNotInLan(code === 403);
    }
    setIsLoading(false);
  };

  //const isWorkWechat = () => {
  //获取user-agaent标识头
  // const ua = window.navigator.userAgent.toLowerCase();
  //判断ua和微信浏览器的标识头是否匹配
  //  if (
  //    ua.match(/micromessenger/i) == "micromessenger" &&
  //   ua.match(/wxwork/i) == "wxwork"
  //) {
  // return true;
  //} else {
  // return false;
  //}
  //};
  const isWorkWechat = () => {
    // 获取user-agent标识头
    const userAgent = window.navigator.userAgent;

    // 检查userAgent是否为null或undefined
    if (!userAgent) {
      return false;
    }

    // 转换为小写
    const ua = userAgent.toLowerCase();

    // 判断ua和微信浏览器的标识头是否匹配
    if (/micromessenger/i.test(ua) && /wxwork/i.test(ua)) {
      return true;
    } else {
      return false;
    }
  };

  const goApply = () => {
    location.href = `//work-order.zhiketong.net/#/process/create-ticket?processId=117`;
  };

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      {!isLoading ? (
        <div>
          {
            // 接口报错
            isRequestErr ? (
              <h2>服务出了点问题~</h2>
            ) : // 不在内网
            isNotInLan ? (
              <h2>请在公司内网使用，无线连接到ZKT-Office或VPN连接</h2>
            ) : // 不在企业微信
            !isWorkWechat() ? (
              <h2 className={styles["not-wx-work"]}>
                请在企业微信里使用ChatGPT。路径：企业微信--工作台--ChatGPT
              </h2>
            ) : // 不在白名单
            !isAllow ? (
              <h2 className={styles["not-allow"]}>
                <span className="text">
                  抱歉，您还没有申请使用权限。请无线连接到ZKT-Office或VPN连接正常
                </span>
                <span onClick={goApply} className={styles["button-2"]}>
                  去申请
                </span>
              </h2>
            ) : (
              <Router>
                {isMobileScreen ? <MobileScreen /> : <WideScreen />}
              </Router>
            )
          }
        </div>
      ) : null}
    </ErrorBoundary>
  );
}
