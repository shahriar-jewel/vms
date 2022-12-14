const VisitorInfo = require('../../model/VisitorModel');

const todayVisitorProvider = async (req, res) => {
    try {
        var data = await VisitorInfo.find(
            {
                "visitor_info.visitor.date": (new Date().toLocaleDateString()).split('/').join('-')
            });
        return data;
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}

const weekVisitorProvider = async (req, res) => {
    try {
        // this weeks visitor
        var today = new Date();
        Date.prototype.getWeek = function () {
            var onejan = new Date(this.getFullYear(), 0, 1);
            return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        }
        var data = await VisitorInfo.aggregate(
            [
                {
                    $project:
                    {
                        _id: 1,
                        visitor_info: 1,
                        week: { $week: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                },
                {
                    $match:
                    {
                        $and: [{ week: today.getWeek() - 1 }, { year: today.getFullYear() }]
                    }
                }
            ]
        )
        return data;

    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}
const monthVisitorProvider = async (req, res) => {
    var today = new Date();
    try {
        var data = await VisitorInfo.aggregate(
            [
                {
                    $project:
                    {
                        _id: 1,
                        visitor_info: 1,
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                },
                {
                    $match:
                    {
                        $and: [{ month: today.getMonth()+1 }, { year: today.getFullYear() }]
                    }
                }
            ]
        )
        return data;

    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}
const todayMemberProvider = async (req, res) => {
    try {
        var data = await VisitorInfo.find(
            {
                "$and" : [
                    {"visitor_info.visitor.date": (new Date().toLocaleDateString()).split('/').join('-')},
                    {"visitor_info.visitor.visitor_type" : 'Member'}
                ]
            });
        return data;
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}
const weekMemberProvider = async (req, res) => {
    try {
        // this weeks visitor
        var today = new Date();
        Date.prototype.getWeek = function () {
            var onejan = new Date(this.getFullYear(), 0, 1);
            return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        }
        var data = await VisitorInfo.aggregate(
            [
                {
                    $project:
                    {
                        _id: 1,
                        visitor_info: 1,
                        week: { $week: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                },
                {
                    $match:
                    {
                        $and: [{ week: today.getWeek() - 1 }, { year: today.getFullYear() },{ "visitor_info.visitor.visitor_type": 'Member' }]
                    }
                }
            ]
        )
        return data;

    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}
const monthMemberProvider = async (req, res) => {
    var today = new Date();
    try {
        var data = await VisitorInfo.aggregate(
            [
                {
                    $project:
                    {
                        _id: 1,
                        visitor_info: 1,
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                },
                {
                    $match:
                    {
                        $and: [{ month: today.getMonth()+1 }, { year: today.getFullYear() },{ "visitor_info.visitor.visitor_type": 'Member' }]
                    }
                }
            ]
        )
        return data;

    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}
const memberCountProvider = async (req,res) => {
    return await VisitorInfo.find({"visitor_info.visitor.visitor_type" : 'Member'}).count();
}
const affiliatedCountProvider = async (req,res) => {
    return await VisitorInfo.find({"visitor_info.visitor.visitor_type" : 'Affiliated'}).count();
}
const guestCountProvider = async (req,res) => {
    return await VisitorInfo.find({"visitor_info.visitor.visitor_type" : 'Guest'}).count();
}
const othersCountProvider = async (req,res) => {
    return await VisitorInfo.find({"visitor_info.visitor.visitor_type" : 'Others'}).count();
}
module.exports = {
    todayVisitorProvider,
    weekVisitorProvider,
    monthVisitorProvider,
    todayMemberProvider,
    weekMemberProvider,
    monthMemberProvider,
    memberCountProvider,
    affiliatedCountProvider,
    guestCountProvider,
    othersCountProvider
};