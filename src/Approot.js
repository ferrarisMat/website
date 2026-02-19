import React from 'react'
import { Route, Switch } from 'react-router';
import { HashRouter } from 'react-router-dom';
import Home from './screens/Home';
import AKFN from './screens/AKFN';
import Test from './screens/Test'

export default function Approot() {
  return (
    <HashRouter>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/AKFN" exact component={AKFN} />
        <Route path="/test" exact component={Test} />
      </Switch>
    </HashRouter>
  )
}