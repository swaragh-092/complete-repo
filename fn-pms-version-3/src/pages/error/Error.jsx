// Author: Gururaj
// Created: 23rd May 2025
// Description: Error Page which wraps layout dynamically by user login or logout
// Version: 1.0.0
// pages/error/Error.jsx
// Modified: 

import { useSelector } from "react-redux";
import { useRouteError } from "react-router-dom";
import ErrorComponent from "./ErrorComponent";
import {LayoutWrapper} from "../../components/Layout";


export default function Error() {
  const error = useRouteError();

  // Access isLoggedIn from redux store
  const isLogin = useSelector((state) => { return state.auth.isLoggedIn});

  return isLogin ? (
    <LayoutWrapper>
      <ErrorComponent error={error} />
    </LayoutWrapper>
  ) : (
    <ErrorComponent error={error} />
  );
}
