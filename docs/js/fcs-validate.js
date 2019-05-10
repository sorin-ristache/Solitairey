define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Adapted from http://www.inventpartners.com/javascript_is_int - thanks.
    function is_int(input) {
        const value = "" + input;
        if (parseFloat(value) === parseInt(value, 10) && !isNaN(input)) {
            return true;
        }
        else {
            return false;
        }
    }
    const _ranks__int_to_str = "0A23456789TJQK";
    exports.ranks__str_to_int = {};
    function _perl_range(start, end) {
        const ret = [];
        for (let i = start; i <= end; i++) {
            ret.push(i);
        }
        return ret;
    }
    exports.NUM_SUITS = 4;
    const _suits = _perl_range(0, exports.NUM_SUITS - 1);
    exports.MIN_RANK = 1;
    exports.MAX_RANK = 13;
    const _ranks = _perl_range(exports.MIN_RANK, exports.MAX_RANK);
    for (const rank of _ranks) {
        exports.ranks__str_to_int[_ranks__int_to_str.substring(rank, rank + 1)] = rank;
    }
    const _suits__int_to_str = "HCDS";
    exports.suits__str_to_int = new Map();
    for (const suit of _suits) {
        exports.suits__str_to_int.set(_suits__int_to_str.substring(suit, suit + 1), suit);
    }
    class Card {
        constructor(rank, suit) {
            this.rank = rank;
            this.suit = suit;
            if (!is_int(rank)) {
                throw "rank is not an integer.";
            }
            if (!is_int(suit)) {
                throw "suit is not an integer.";
            }
            if (rank < 1) {
                throw "rank is too low.";
            }
            if (rank > exports.MAX_RANK) {
                throw "rank is too high.";
            }
            if (suit < 0) {
                throw "suit is negative.";
            }
            if (suit >= exports.NUM_SUITS) {
                throw "suit is too high.";
            }
        }
        getRank() {
            return this.rank;
        }
        getSuit() {
            return this.suit;
        }
        toString() {
            return (_ranks__int_to_str.substring(this.rank, this.rank + 1) +
                _suits__int_to_str.substring(this.suit, this.suit + 1));
        }
    }
    class BoardTextLine {
        constructor(line) {
            this.line = line;
            const that = this;
            const m1 = line.match(/^([^\n\r]*)([\n\r]*)$/);
            that.newline = m1[2];
            let l = m1[1];
            if (m1[1].match(/#/)) {
                const m2 = m1[1].match(/^(.*?)(#.*)/);
                that.comment = m2[2];
                l = m2[1];
            }
            else {
                that.comment = "";
            }
            if (l.match(/:/)) {
                const m3 = l.match(/^([^:]*:)(.*)/);
                that.prefix = m3[1];
                that.content = m3[2];
            }
            else {
                that.prefix = "";
                that.content = l;
            }
            return;
        }
        getContent() {
            return this.content;
        }
        capitalize() {
            const that = this;
            const ret = that.prefix +
                that.getContent().toUpperCase() +
                that.comment +
                that.newline;
            return ret;
        }
    }
    function capitalize_cards(board) {
        return board
            .match(/[^\n]*\n?/g)
            .map((l) => {
            return new BoardTextLine(l).capitalize();
        })
            .join("");
    }
    exports.capitalize_cards = capitalize_cards;
    class Column {
        constructor(cards) {
            this.cards = cards;
        }
        getLen() {
            return this.cards.length;
        }
        getCard(idx) {
            const that = this;
            if (idx < 0) {
                throw "idx is below zero.";
            }
            if (idx >= that.getLen()) {
                throw "idx exceeds the length of the column.";
            }
            return that.cards[idx];
        }
        getArrOfStrs() {
            const that = this;
            return _perl_range(0, that.getLen() - 1).map((i) => {
                return that.getCard(i).toString();
            });
        }
        toString() {
            const that = this;
            return (Array.prototype.concat
                .apply([], [[":"], that.getArrOfStrs()])
                .join(" ") + "\n");
        }
    }
    const suit_re = "[HCDS]";
    const rank_re = "[A23456789TJQK]";
    const card_re = "(" + rank_re + ")(" + suit_re + ")";
    function fcs_js__card_from_string(s) {
        const m = s.match("^" + card_re + "$");
        if (!m) {
            throw 'Invalid format for a card - "' + s + '"';
        }
        return new Card(exports.ranks__str_to_int[m[1]], exports.suits__str_to_int.get(m[2]));
    }
    exports.fcs_js__card_from_string = fcs_js__card_from_string;
    class BaseResult {
        constructor(is_correct, start_char_idx, num_consumed_chars, error) {
            this.is_correct = is_correct;
            this.start_char_idx = start_char_idx;
            this.num_consumed_chars = num_consumed_chars;
            this.error = error;
        }
        getEnd() {
            return this.start_char_idx + this.num_consumed_chars;
        }
    }
    class ColumnParseResult extends BaseResult {
        constructor(is_correct, start_char_idx, num_consumed_chars, error, cards) {
            super(is_correct, start_char_idx, num_consumed_chars, error);
            this.col = new Column(cards);
        }
    }
    class StringParser {
        constructor(s) {
            this.s = s;
            this.consumed = 0;
        }
        consume(m) {
            const that = this;
            const len_match = m[1].length;
            that.consumed += len_match;
            that.s = that.s.substring(len_match);
            return;
        }
        getConsumed() {
            return this.consumed;
        }
        isNotEmpty() {
            return this.s.length > 0;
        }
        match(re) {
            return this.s.match(re);
        }
        consume_match(re) {
            const that = this;
            const m = that.match(re);
            if (m) {
                that.consume(m);
            }
            return m;
        }
        skipComments() {
            const that = this;
            that.consume_match(/^((?:[ \t]*#[^\n\r]*\r?\n)*)/);
            return;
        }
    }
    class CardsStringParser extends StringParser {
        constructor(s, card_mapper) {
            super(s);
            this.card_mapper = card_mapper;
            this.cards = [];
            this.is_start = true;
        }
        afterStart() {
            this.is_start = false;
            return;
        }
        getStartSpace() {
            return this.is_start ? "" : " +";
        }
        should_loop() {
            const that = this;
            return (that.isNotEmpty() && !that.consume_match(/^(\s*(?:#[^\n]*)?\n?)$/));
        }
        add(m) {
            this.cards.push(this.card_mapper(m[2]));
            this.afterStart();
            return;
        }
        loop(re, callback) {
            const p = this;
            while (p.should_loop()) {
                const m = p.consume_match("^(" + p.getStartSpace() + "(" + re + ")" + ")");
                if (!m) {
                    p.consume_match("^( *)");
                    return callback();
                }
                p.add(m);
            }
            return null;
        }
    }
    function fcs_js__column_from_string(start_char_idx, orig_s, force_leading_colon) {
        const p = new CardsStringParser(orig_s, fcs_js__card_from_string);
        const match = p.consume_match("^((?:: +|:(?:$|(?=\\n)))?)");
        if (force_leading_colon && !match[1].length) {
            return new ColumnParseResult(false, start_char_idx, p.getConsumed(), 'Columns must start with a ":" in strict mode.', []);
        }
        const ret = p.loop(card_re, () => {
            return new ColumnParseResult(false, start_char_idx, p.getConsumed(), "Wrong card format - should be [Rank][Suit]", []);
        });
        if (ret) {
            return ret;
        }
        return new ColumnParseResult(true, start_char_idx, p.getConsumed(), "", p.cards);
    }
    exports.fcs_js__column_from_string = fcs_js__column_from_string;
    class Freecells {
        constructor(num_freecells, cards) {
            this.num_freecells = num_freecells;
            this.cards = cards;
            if (!is_int(num_freecells)) {
                throw "num_freecells is not an integer.";
            }
            if (cards.length !== num_freecells) {
                throw "cards length mismatch.";
            }
        }
        getNum() {
            return this.num_freecells;
        }
        getCard(idx) {
            const that = this;
            if (idx < 0) {
                throw "idx is below zero.";
            }
            if (idx >= that.getNum()) {
                throw "idx exceeds the length of the column.";
            }
            return that.cards[idx];
        }
        getArrOfStrs() {
            const that = this;
            return _perl_range(0, that.getNum() - 1).map((i) => {
                const card = that.getCard(i);
                return card !== null ? card.toString() : "-";
            });
        }
        toString() {
            const that = this;
            return (Array.prototype.concat
                .apply([], [["Freecells:"], that.getArrOfStrs()])
                .join(" ") + "\n");
        }
    }
    // TODO : Merge common functionality with ColumnParseResult into a base class.
    class FreecellsParseResult extends BaseResult {
        constructor(is_correct, start_char_idx, num_consumed_chars, error, num_freecells, fc) {
            super(is_correct, start_char_idx, num_consumed_chars, error);
            if (is_correct) {
                this.freecells = new Freecells(num_freecells, fc);
            }
        }
    }
    function fcs_js__freecells_from_string(num_freecells, start_char_idx, orig_s) {
        const p = new CardsStringParser(orig_s, (card_str) => {
            return card_str === "-" ? null : fcs_js__card_from_string(card_str);
        });
        function make_ret(verdict, err_str) {
            return new FreecellsParseResult(verdict, start_char_idx, p.getConsumed(), err_str, num_freecells, verdict ? p.cards : []);
        }
        if (!p.consume_match(new RegExp("^(" + freecells_prefix_re + ":(?: +|$|(?=\\n)))"))) {
            return make_ret(false, 'Wrong line prefix for freecells - should be "Freecells:"');
        }
        const ret = p.loop("\\-|(?:" + card_re + ")", () => {
            return make_ret(false, "Wrong card format - should be [Rank][Suit]");
        });
        if (ret) {
            return ret;
        }
        while (p.cards.length < num_freecells) {
            p.cards.push(null);
        }
        if (p.cards.length !== num_freecells) {
            return make_ret(false, "Too many cards specified in Freecells line.");
        }
        return make_ret(true, "");
    }
    exports.fcs_js__freecells_from_string = fcs_js__freecells_from_string;
    class Foundations {
        constructor() {
            this.ranks = [-1, -1, -1, -1];
        }
        getByIdx(deck, suit) {
            this._validateDeckSuit(deck, suit);
            return this.ranks[suit];
        }
        setByIdx(deck, suit, rank) {
            this._validateDeckSuit(deck, suit);
            if (!is_int(rank)) {
                throw "Rank must be an integer.";
            }
            if (!(rank >= 0 && rank <= exports.MAX_RANK)) {
                throw "rank is out of range.";
            }
            if (this.ranks[suit] >= 0) {
                return false;
            }
            this.ranks[suit] = rank;
            return true;
        }
        finalize() {
            const that = this;
            for (let i = 0; i < exports.NUM_SUITS; i++) {
                if (that.getByIdx(0, i) < 0) {
                    that.setByIdx(0, i, 0);
                }
            }
            return;
        }
        toString() {
            const that = this;
            const arr = [];
            for (const suit of _suits) {
                const val = that.getByIdx(0, suit);
                if (val > 0) {
                    arr.push(_suits__int_to_str[suit] + "-" + _ranks__int_to_str[val]);
                }
            }
            return (Array.prototype.concat
                .apply([], [["Foundations:"], arr])
                .join(" ") + "\n");
        }
        _validateDeckSuit(deck, suit) {
            if (deck !== 0) {
                throw "multiple decks are not supported.";
            }
            if (!is_int(suit)) {
                throw "suit is not an integer.";
            }
            if (!(suit >= 0 && suit < exports.NUM_SUITS)) {
                throw "suit is out of range.";
            }
            return;
        }
    }
    exports.Foundations = Foundations;
    class FoundationsParseResult extends BaseResult {
        constructor(is_correct, start_char_idx, num_consumed_chars, error, foundations) {
            super(is_correct, start_char_idx, num_consumed_chars, error);
            if (is_correct) {
                this.foundations = foundations;
            }
        }
    }
    const foundations_prefix_re = /^((?:Foundations|Founds|FOUNDS)\:)/;
    const freecells_prefix_re = "(?:Freecells|FC|Fc)";
    function fcs_js__foundations_from_string(num_decks, start_char_idx, orig_s) {
        if (num_decks !== 1) {
            throw "Can only handle 1 decks.";
        }
        const p = new StringParser(orig_s);
        const founds = new Foundations();
        function make_ret(verdict, err_str) {
            if (verdict) {
                founds.finalize();
            }
            return new FoundationsParseResult(verdict, start_char_idx, p.getConsumed(), err_str, founds);
        }
        if (!p.consume_match(foundations_prefix_re)) {
            return make_ret(false, 'Wrong line prefix for the foundations - should be "Foundations:"');
        }
        while (p.isNotEmpty()) {
            if (p.consume_match(/^( *\n?)$/)) {
                break;
            }
            const m = p.consume_match("^( +(" + suit_re + ")-(" + rank_re + "))");
            if (!m) {
                return make_ret(false, "Could not match a foundation string [HCDS]-[A23456789TJQK]");
            }
            const suit = m[2];
            if (!founds.setByIdx(0, exports.suits__str_to_int.get(suit), exports.ranks__str_to_int[m[3]])) {
                return make_ret(false, 'Suit "' + suit + '" was already set.');
            }
        }
        return make_ret(true, "");
    }
    exports.fcs_js__foundations_from_string = fcs_js__foundations_from_string;
    var ErrorLocationType;
    (function (ErrorLocationType) {
        ErrorLocationType[ErrorLocationType["Foundations"] = 0] = "Foundations";
        ErrorLocationType[ErrorLocationType["Freecells"] = 1] = "Freecells";
        ErrorLocationType[ErrorLocationType["Column"] = 2] = "Column";
    })(ErrorLocationType = exports.ErrorLocationType || (exports.ErrorLocationType = {}));
    class ErrorLocation {
        constructor(type_, idx, start, end) {
            this.type_ = type_;
            this.idx = idx;
            this.start = start;
            this.end = end;
        }
    }
    var ParseErrorType;
    (function (ParseErrorType) {
        ParseErrorType[ParseErrorType["VALID"] = 0] = "VALID";
        ParseErrorType[ParseErrorType["TOO_MUCH_OF_CARD"] = 1] = "TOO_MUCH_OF_CARD";
        ParseErrorType[ParseErrorType["NOT_ENOUGH_OF_CARD"] = 2] = "NOT_ENOUGH_OF_CARD";
        ParseErrorType[ParseErrorType["FOUNDATIONS_NOT_AT_START"] = 3] = "FOUNDATIONS_NOT_AT_START";
        ParseErrorType[ParseErrorType["FREECELLS_NOT_AT_START"] = 4] = "FREECELLS_NOT_AT_START";
        ParseErrorType[ParseErrorType["LINE_PARSE_ERROR"] = 5] = "LINE_PARSE_ERROR";
        ParseErrorType[ParseErrorType["LOWERCASE_LETTERS"] = 6] = "LOWERCASE_LETTERS";
        ParseErrorType[ParseErrorType["HAS_10_STRINGS"] = 7] = "HAS_10_STRINGS";
    })(ParseErrorType = exports.ParseErrorType || (exports.ParseErrorType = {}));
    class ParseError {
        constructor(type_, locs, card) {
            this.type_ = type_;
            this.locs = locs;
            this.card = card;
            this.problem_strings = [];
        }
    }
    class ParseLocation {
        constructor(type_, row, col) {
            this.type_ = type_;
            this.row = row;
            this.col = col;
        }
    }
    class BoardParseResult {
        constructor(num_stacks, num_freecells, orig_s) {
            this.num_stacks = num_stacks;
            this.num_freecells = num_freecells;
            this.errors = [];
            this.is_valid = true;
            const that = this;
            const lines = orig_s.match(/[^\n]*\n?/g).map((l) => {
                return new BoardTextLine(l);
            });
            for (const l of lines) {
                {
                    const matches = l.getContent().match(/[a-z]+/g);
                    if (matches && matches.length > 0) {
                        const err = new ParseError(ParseErrorType.LOWERCASE_LETTERS, [], fcs_js__card_from_string("AH"));
                        err.problem_strings = matches;
                        that.errors.push(err);
                        that.is_valid = false;
                    }
                }
                {
                    const matches = l.getContent().match(/10/g);
                    if (matches && matches.length > 0) {
                        const err = new ParseError(ParseErrorType.HAS_10_STRINGS, [], fcs_js__card_from_string("AH"));
                        err.problem_strings = matches;
                        that.errors.push(err);
                        that.is_valid = false;
                    }
                }
            }
            that.columns = [];
            const counter = _suits.map((i) => {
                return _perl_range(0, exports.MAX_RANK).map((i) => {
                    return [];
                });
            });
            const p = new StringParser(orig_s);
            p.skipComments();
            if (p.match(foundations_prefix_re)) {
                const start_char_idx = p.getConsumed();
                const l = p.consume_match(/^([^\n]*(?:\n|$))/)[1];
                const fo = fcs_js__foundations_from_string(1, start_char_idx, l);
                that.foundations = fo;
                if (!fo.is_correct) {
                    that.errors.push(new ParseError(ParseErrorType.LINE_PARSE_ERROR, [
                        new ErrorLocation(ErrorLocationType.Foundations, 0, start_char_idx, p.getConsumed()),
                    ], fcs_js__card_from_string("AH")));
                    that.is_valid = false;
                    return;
                }
            }
            p.skipComments();
            if (p.match(new RegExp("^" + freecells_prefix_re + ":"))) {
                const start_char_idx = p.getConsumed();
                const l = p.consume_match(/^([^\n]*(?:\n|$))/)[1];
                const fc = fcs_js__freecells_from_string(num_freecells, start_char_idx, l);
                that.freecells = fc;
                if (!fc.is_correct) {
                    that.errors.push(new ParseError(ParseErrorType.LINE_PARSE_ERROR, [
                        new ErrorLocation(ErrorLocationType.Freecells, 0, start_char_idx, p.getConsumed()),
                    ], fcs_js__card_from_string("AH")));
                    that.is_valid = false;
                    return;
                }
            }
            for (let i = 0; i < num_stacks; ++i) {
                p.skipComments();
                const start_char_idx = p.getConsumed();
                const l = p.consume_match(/^([^\n]*(?:\n|$))/)[1];
                const col = fcs_js__column_from_string(start_char_idx, l, false);
                that.columns.push(col);
                if (!col.is_correct) {
                    that.errors.push(new ParseError(ParseErrorType.LINE_PARSE_ERROR, [
                        new ErrorLocation(ErrorLocationType.Column, i, start_char_idx, p.getConsumed()),
                    ], fcs_js__card_from_string("AH")));
                    that.is_valid = false;
                    return;
                }
            }
            if (that.foundations) {
                for (const suit of _suits) {
                    for (const rank of _perl_range(1, that.foundations.foundations.getByIdx(0, suit))) {
                        counter[suit][rank].push(new ParseLocation(ErrorLocationType.Foundations, 0, 0));
                    }
                }
            }
            if (that.freecells) {
                for (const i of _perl_range(0, that.freecells.freecells.getNum() - 1)) {
                    const card = that.freecells.freecells.getCard(i);
                    if (card) {
                        counter[card.getSuit()][card.getRank()].push(new ParseLocation(ErrorLocationType.Freecells, i, 0));
                    }
                }
            }
            that.columns.forEach((col_res, idx) => {
                const col = col_res.col;
                for (const h of _perl_range(0, col.getLen() - 1)) {
                    const card = col.getCard(h);
                    counter[card.getSuit()][card.getRank()].push(new ParseLocation(ErrorLocationType.Column, idx, h));
                }
            });
            const NUM_WANTED_CARDS = 1;
            const too_many_cards__errors = [];
            const not_enough_cards__errors = [];
            for (const suit of _suits) {
                for (const rank of _ranks) {
                    const count = counter[suit][rank];
                    function add_error(arr, type_, locs) {
                        arr.push(new ParseError(type_, locs, new Card(rank, suit)));
                        that.is_valid = false;
                        return;
                    }
                    if (count.length > NUM_WANTED_CARDS) {
                        const locs = count.map((v) => {
                            return new ErrorLocation(v.type_, v.row, 0, 0);
                        });
                        add_error(too_many_cards__errors, ParseErrorType.TOO_MUCH_OF_CARD, locs);
                    }
                    else if (count.length < NUM_WANTED_CARDS) {
                        add_error(not_enough_cards__errors, ParseErrorType.NOT_ENOUGH_OF_CARD, []);
                    }
                }
            }
            that.errors.push(...too_many_cards__errors);
            that.errors.push(...not_enough_cards__errors);
            return;
        }
        getBoardString() {
            const that = this;
            let ret = "";
            if (that.foundations) {
                ret += that.foundations.foundations.toString();
            }
            if (that.freecells) {
                ret += that.freecells.freecells.toString();
            }
            for (const col of that.columns) {
                ret += col.col.toString();
            }
            return ret;
        }
    }
    exports.BoardParseResult = BoardParseResult;
});
