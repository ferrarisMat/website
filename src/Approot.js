import React from 'react'
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import Home from './screens/Home';
import Stream from './screens/Stream';

export default function Approot() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/stream" component={Stream} />
      </Switch>
    </BrowserRouter>
  )
}