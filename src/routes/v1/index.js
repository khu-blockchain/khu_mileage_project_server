const express = require('express');
const academicFieldRoute = require('./academicField.route');
const studentRoute = require('./student.route');
const authRoute = require('./auth.route');
const swMileageRoute = require('./swMileage.route');
const swMileageTokenRoute = require('./swMileageToken.route');
const swMileageTokenHistoryRoute = require('./swMileageTokenHistory.route');

const router = express.Router();

const defaultRoutes = [
    {
        path : '/academic-field',
        route: academicFieldRoute,
    },
    {
        path : '/students',
        route: studentRoute,
    },
    {
        path : '/auth',
        route: authRoute,
    },
    {
    path : '/sw-mileages',
        route: swMileageRoute,
    },
    {
        path : '/sw-mileage-tokens',
        route: swMileageTokenRoute,
    },
    {
        path : '/sw-mileage-token-histories',
        route: swMileageTokenHistoryRoute,
    },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

module.exports = router;
