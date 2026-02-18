import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const APP_GRADIENT = ['#f97316', '#0a1220', '#070d1a'];

const AppGradient = ({ children, style }) => (
  <LinearGradient colors={APP_GRADIENT} style={style}>
    {children}
  </LinearGradient>
);

export default AppGradient;
