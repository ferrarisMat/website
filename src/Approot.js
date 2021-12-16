import React from 'react'
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import Home from './screens/Home';
import AKFN from './screens/AKFN';

export default function Approot() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/AKFN" exact component={AKFN} />
      </Switch>
    </BrowserRouter>
  )
}