const academicField = {
    academicField: {
        "국내 학술회의 논문 발표": {
            "주저자 (100%)": {
                default: 50,
                optional: false,
                description: null
            },
            "공동저자 (50%)": {
                default: 25,
                optional: false,
                description: null
            }
        },
        "국내 학술지 논문 게재": {
            "주저자 (100%)": {
                default: 100,
                optional: false,
                description: null
            },
            "공동저자 (70%)": {
                default: 70,
                optional: false,
                description: null
            }
        },
        "우수논문 수상": {
            "최우수상": {
                default: 50,
                optional: true,
                description: "50(공저 35)"
            },
            "우수상": {
                default: 30,
                optional: true,
                description: "30(공저 21)"
            },
            "장려상": {
                default: 10,
                optional: true,
                description: "10(공저 7)"
            }
        },
        "오픈소스 코드기여": {
            default: 200,
            optional: false,
            description: null
        },
        "교내 경진대회 및 공모전 수상": {
            default: 100,
            optional: false,
            description: null
        },
        "교외 경진대회 및 공모전 수상": {
            default: 200,
            optional: false,
            description: null
        },
        "국내 특허 출원": {
            default: 150,
            optional: false,
            description: null
        },
        "SW중심대학 사업단 진행행사 참여": {
            "IITP 교육만족도 설문 및 전공/기초/융합 교육 만족도 설문조사 등 참가": {
                default: 20,
                optional: false,
                description: null
            },
            "TOPCIT, SW인재 페스티벌 오픈소스 해커톤 봄/가을 경시대회 등 참가": {
                default: 20,
                optional: true,
                description: "20~50"
            },
            "IITP, 협의회 및 타대학과의 공동추진행 행사 참여(1건당)(사업단에서 사전홍보된 행사에 한함)": {
                default: 20,
                optional: false,
                description: null
            }
        }
    },
    internationalField: {
        "국외 학술회의 논문 발표": {
            "주저자 (100%)": {
                default: 100,
                optional: false,
                description: null
            },
            "공동저자 (70%)": {
                default: 70,
                optional: false,
                description: null
            }
        },
        "국외 학술지 논문 게제": {
            "주저자 (100%)": {
                default: 250,
                optional: false,
                description: null
            },
            "공동저자 (70%)": {
                default: 175,
                optional: false,
                description: null
            }
        },
        "오픈소스 영어 기술 문서 번역": {
            default: 80,
            optional: false,
            description: null
        },
        "영어 봉사활동 실적": {
            "해외 IT 봉사단 등": {
                default: 100,
                optional: false,
                description: null
            },
            "국내 봉사활동 등": {
                default: 50,
                optional: false,
                description: null
            }
        }
    },
    entrepreneurshipField: {
        "전공 관련 창업": {
            default: 250,
            optional: false,
            description: null
        },
        "앱스토어 소프트웨어 등록(단위점수:1점)": {
            default: 0,
            optional: false,
            description: "최대250"
        },
        "창업 공모전 수상": {
            default: 150,
            optional: false,
            description: null
        },
        "산업체 실무 경험을 위한 장/단기 인턴수료(현장실습장학 수혜학생은 중복안됨)": {
            default: 50,
            optional: false,
            description: null
        }
    },
    serviceField: {
        "아너십 (마일리지 우수활동 학생)": {
            "강의(1회차 1시간 이상)": {
                default: 50,
                optional: true,
                description: "50 (2회차부터는 10)"
            },
            "멘토보고서 (건당)": {
                default: 15,
                optional: false,
                description: null
            },
            "그 외 활동 (건당)": {
                default: 10,
                optional: false,
                description: null
            }
        },
        "SW나눔봉사단": {
            default: 10,
            optional: false,
            description: null
        }
    },
    otherActivities: {
        "사업단장 인정 기타활동": {
            "SW중심대학 장학위원회 심의 특별항목": {
                default: 10,
                optional: true,
                description: "10~100"
            },
            "현장실습 활동우수": {
                default: 10,
                optional: true,
                description: "10~100"
            }
        }
    }
};

module.exports = academicField;
