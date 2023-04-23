class FormatDate{
    constructor( date ){
        let time = date.split('_')[1].split('-');
        date = date.split('_')[0].split('-');

        this.year = date[0];
        this.month = date[1];
        this.day = date[2];

        this.hour = time[0];
        this.minute = time[1];
        this.second = time[1];

        this.timestamp =
            (( this.second * 1000 ) +
            ( this.minute * 60000 ) +
            ( this.hour * 3.6e+6 ) +
            ( this.day * 8.64e+7 ) +
            ( this.month * 2.6298e+9 ) +
            ( this.year * 3.15576e+10 )) / 1000;
    }
}

class FormatPartDate{
    constructor( date ){
        this.year = date.split('-')[0];
        this.month = date.split('-')[1];

        this.timestamp =
            (( this.month * 2.6298e+9 ) +
            ( this.year * 3.15576e+10 )) / 1000;
    }
}

module.exports = { FormatDate, FormatPartDate };