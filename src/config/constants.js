module.exports = {
    ACADEMIC_FIELD_CATEGORY: {
        ACADEMIC_FIELD: '학술분야',
        INTERNATIONAL_FIELD: '국제분야',
        ENTREPRENEURSHIP_FIELD: '창업분야',
        SERVICE_FIELD: '봉사분야',
        OTHER_ACTIVITIES: '기타활동',
    },
    LOGIN_TYPE: {
        STUDENT: 'STUDENT',
        ADMIN: 'ADMIN',
    },
    TOKEN_TYPE: {
        ACCESS: 1,
        REFRESH: 2,
    },
    COOKIE: {
        STUDENT: 'KHU_MILEAGE_STUDENT',
        ADMIN: 'KHU_MILEAGE_ADMIN',
    },
    ROLE: {
        STUDENT: 1,
        ADMIN: 2,
        ROOT_ADMIN: 3,
    },
    SW_MILEAGE_STATUS: {
        CREATE: 2,
        APPROVE: 1,
        DENIED: 0
    },
    SW_MILEAGE_TOKEN: {
        IS_PAUSE: {
            UNPAUSE: 0,
            PAUSE: 1,
        },
        IS_ACTIVATED: {
            DEACTIVATED: 0,
            ACTIVATED: 1,
        }
    },
    SW_MILEAGE_TOKEN_HISTORY: {
        STATUS: {
            CREATE: 2,
            SUCCESS: 1,
            FAIL: 0
        },
        TRANSACTION_TYPE: {
            MINT: 'mint',
            BURN_FROM: 'burnFrom',
            APPROVE: 'approve',
            REJECT: 'reject',
        }
    },
    PEB_UNIT: {
        KLAY : "KLAY"
    },
    SERVICE_NAME : "KHU",
    MAX_APPROVE_AMOUNT : '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    // DEPLOY_KIP7_GAS : 5000000,
    DEPLOY_KIP7_GAS : 5000000,
}