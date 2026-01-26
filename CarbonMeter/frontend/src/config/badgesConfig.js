/**
 * BADGE CONFIGURATION FOR INDIVIDUAL USER DASHBOARD
 * India-based emission thresholds
 * All values in tCO₂e (metric tons CO2 equivalent)
 */

import carbonAwareImg from '../assets/badges/carbon-aware.jpeg';
import carbonIntensiveImg from '../assets/badges/carbon-intensive.jpeg';
import carbonVanguardImg from '../assets/badges/carbon-vanguard.jpeg';
import criticalEmissionImg from '../assets/badges/critical-emission-zone.jpeg';
import efficiencyOptimizedImg from '../assets/badges/efficiency-optimized.jpeg';
import emissionAlertImg from '../assets/badges/emission-alert.jpeg';
import highEmissionImg from '../assets/badges/high-emission-profile.jpeg';
import lowCarbonLeaderImg from '../assets/badges/low-carbon-leader.jpeg';
import netZeroReadyImg from '../assets/badges/net-zero-ready.jpeg';
import operationalAverageImg from '../assets/badges/operational-average.jpeg';

/**
 * INDIA EMISSION THRESHOLDS (Annual)
 * Reference: Per capita avg ~2.5 tCO₂e, National average ~4-5 tCO₂e
 */
const THRESHOLDS = {
  INDIA_PER_CAPITA: 2.5, // tCO₂e per person per year
  INDIA_NATIONAL_AVG: 4.5, // National average
  CRITICAL_THRESHOLD: 10, // Way above average
  HIGH_EMISSION_THRESHOLD: 7, // Above average
  AVERAGE_THRESHOLD: 4.5, // National average
  LOW_CARBON_THRESHOLD: 2, // Lowest 25%
  EXCELLENT_THRESHOLD: 1, // Very low
};

/**
 * BADGE DEFINITIONS
 * Order matters - displayed in this sequence
 */
export const badgesConfig = [
  {
    id: 'emission-alert',
    name: 'Emission Alert',
    image: emissionAlertImg,
    category: 'warning',
    description: 'Sudden spike detected in emissions',
    unlockCondition: (emissionData) => {
      // Check if there's a sudden spike (20% increase from average)
      if (!emissionData) return false;
      const { totalEmissions, monthlyEmissions, previousMonthEmissions } = emissionData;
      if (!monthlyEmissions || !previousMonthEmissions) return false;
      const increase = ((monthlyEmissions - previousMonthEmissions) / previousMonthEmissions) * 100;
      return increase > 20; // 20% spike
    },
    unlockedTooltip: 'Your recent emissions spiked - try to reduce activities',
    lockedTooltip: 'Reduce your carbon emissions to unlock this badge',
  },
  {
    id: 'critical-emission-zone',
    name: 'Critical Emission Zone',
    image: criticalEmissionImg,
    category: 'danger',
    description: 'Emission far above safe limit',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      return emissionData.totalEmissions > THRESHOLDS.CRITICAL_THRESHOLD;
    },
    unlockedTooltip: 'Your emissions exceed 10 tCO₂e annually - urgent action needed',
    lockedTooltip: 'Reduce your carbon emissions to unlock this badge',
  },
  {
    id: 'high-emission-profile',
    name: 'High-Emission Profile',
    image: highEmissionImg,
    category: 'warning',
    description: 'Emission above warning threshold',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      return (
        emissionData.totalEmissions > THRESHOLDS.HIGH_EMISSION_THRESHOLD &&
        emissionData.totalEmissions <= THRESHOLDS.CRITICAL_THRESHOLD
      );
    },
    unlockedTooltip: 'Your emissions are 7-10 tCO₂e - reduce transport & energy',
    lockedTooltip: 'Reduce your carbon emissions to unlock this badge',
  },
  {
    id: 'carbon-intensive',
    name: 'Carbon Intensive',
    image: carbonIntensiveImg,
    category: 'warning',
    description: 'Emission consistently high',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      // Carbon intensive if consistently above national average
      return (
        emissionData.totalEmissions > THRESHOLDS.AVERAGE_THRESHOLD &&
        emissionData.totalEmissions <= THRESHOLDS.HIGH_EMISSION_THRESHOLD
      );
    },
    unlockedTooltip: 'Your baseline emissions exceed national average',
    lockedTooltip: 'Reduce your carbon emissions to unlock this badge',
  },
  {
    id: 'operational-average',
    name: 'Operational Average',
    image: operationalAverageImg,
    category: 'info',
    description: 'Emission within national average range',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      return (
        emissionData.totalEmissions > THRESHOLDS.LOW_CARBON_THRESHOLD &&
        emissionData.totalEmissions <= THRESHOLDS.AVERAGE_THRESHOLD
      );
    },
    unlockedTooltip: 'Your emissions are within Indian national average (4-5 tCO₂e)',
    lockedTooltip: 'Reduce your carbon emissions to unlock this badge',
  },
  {
    id: 'carbon-aware',
    name: 'Carbon Aware',
    image: carbonAwareImg,
    category: 'success',
    description: 'Emission ≤ Indian per-capita average',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      return (
        emissionData.totalEmissions <= THRESHOLDS.INDIA_PER_CAPITA &&
        emissionData.totalEmissions > THRESHOLDS.EXCELLENT_THRESHOLD
      );
    },
    unlockedTooltip: 'Excellent! Your emissions match India\'s per-capita average (2.5 tCO₂e)',
    lockedTooltip: 'Reduce your carbon emissions to unlock this badge',
  },
  {
    id: 'low-carbon-leader',
    name: 'Low-Carbon Leader',
    image: lowCarbonLeaderImg,
    category: 'success',
    description: 'Emission in lowest ~25% (≤2 tCO₂e)',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      return (
        emissionData.totalEmissions <= THRESHOLDS.LOW_CARBON_THRESHOLD &&
        emissionData.totalEmissions > THRESHOLDS.EXCELLENT_THRESHOLD
      );
    },
    unlockedTooltip: 'Outstanding! You\'re in the lowest 25% of emitters (≤2 tCO₂e)',
    lockedTooltip: 'Reduce your carbon emissions to unlock this badge',
  },
  {
    id: 'net-zero-ready',
    name: 'Net-Zero Ready',
    image: netZeroReadyImg,
    category: 'success',
    description: 'Continuous low emissions or sharp reduction',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      const { totalEmissions, previousMonthEmissions, monthlyEmissions } = emissionData;
      
      // Net-Zero Ready if:
      // 1. Current emissions are very low (<1.5 tCO₂e), OR
      // 2. Reduction from previous month is >30%
      const isVeryLow = totalEmissions < 1.5;
      const hasSharpReduction = 
        monthlyEmissions && previousMonthEmissions &&
        ((previousMonthEmissions - monthlyEmissions) / previousMonthEmissions) * 100 > 30;
      
      return isVeryLow || hasSharpReduction;
    },
    unlockedTooltip: 'Amazing! You\'re on the path to net-zero emissions',
    lockedTooltip: 'Achieve very low emissions or a sharp reduction to unlock',
  },
  {
    id: 'carbon-vanguard',
    name: 'Carbon Vanguard',
    image: carbonVanguardImg,
    category: 'success',
    description: 'Long-term sustained low emissions',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      // Carbon Vanguard requires sustained excellence
      // Emissions should be <1 tCO₂e consistently
      return emissionData.totalEmissions < THRESHOLDS.EXCELLENT_THRESHOLD;
    },
    unlockedTooltip: 'Legendary! Sustained carbon leadership - you\'re a climate champion',
    lockedTooltip: 'Achieve sustained ultra-low emissions (<1 tCO₂e)',
  },
  {
    id: 'efficiency-optimized',
    name: 'Efficiency Optimized',
    image: efficiencyOptimizedImg,
    category: 'success',
    description: '≥ 20% reduction vs previous period',
    unlockCondition: (emissionData) => {
      if (!emissionData) return false;
      const { monthlyEmissions, previousMonthEmissions } = emissionData;
      if (!monthlyEmissions || !previousMonthEmissions) return false;
      
      const reduction = ((previousMonthEmissions - monthlyEmissions) / previousMonthEmissions) * 100;
      return reduction >= 20; // 20% or more reduction
    },
    unlockedTooltip: 'Great optimization! You achieved ≥20% emission reduction this period',
    lockedTooltip: 'Reduce your emissions by 20% vs previous period to unlock',
  },
];

export default badgesConfig;
