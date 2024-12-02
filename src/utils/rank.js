const { GetSwMileageTokenRankDTO } = require("../dtos/swMileageToken.dto")

const sortRank = (rankList, studentList, from) => {
    const sortedRankList = rankList.map((data, index) => {
        const matchingStudent = studentList.find(student => student.wallet_address === data.account)

        return new GetSwMileageTokenRankDTO({
            rank: from + index,
            id: matchingStudent.student_id,
            name: matchingStudent.name,
            email: matchingStudent.email,
            phone_number: matchingStudent.phone_number,
            department: matchingStudent.department,
            wallet_address: data.account,
            balance: data.balance,
        })
    })

    console.log("sortRankList : ", sortedRankList)

    return sortedRankList
}

module.exports = {
    sortRank
};
