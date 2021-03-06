YUI.add(
    "yukon",
    function(Y) {
        const Solitaire = Y.Solitaire,
            Yukon = (Solitaire.Yukon = Solitaire.instance(Solitaire, {
                fields: ["Foundation", "Tableau"],

                deal: function() {
                    let card,
                        piles = 6,
                        stack = 0;
                    const deck = this.deck,
                        stacks = this.tableau.stacks;

                    while (piles >= 0) {
                        card = deck.pop().faceUp();
                        stacks[6 - piles].push(card);

                        for (stack = 7 - piles; stack < 7; stack++) {
                            card = deck.pop();
                            stacks[stack].push(card);
                        }
                        piles--;
                    }

                    stack = 1;
                    while (deck.cards.length) {
                        card = deck.pop().faceUp();
                        stacks[stack].push(card);
                        stack = (stack % 6) + 1;
                    }
                },

                height: function() {
                    return this.Card.base.height * 4.8;
                },

                Stack: Solitaire.instance(Solitaire.Stack),

                Foundation: {
                    stackConfig: {
                        total: 4,
                        layout: {
                            vspacing: 1.25,
                            top: 0,
                            left: function() {
                                return Solitaire.Card.width * 9;
                            },
                        },
                    },
                    field: "foundation",
                    draggable: false,
                },

                Tableau: {
                    stackConfig: {
                        total: 7,
                        layout: {
                            hspacing: 1.25,
                            top: 0,
                            left: 0,
                        },
                    },
                    field: "tableau",
                    draggable: true,
                },

                Card: Solitaire.instance(Solitaire.Card, {
                    playable: function() {
                        return (
                            this.stack.field === "tableau" && !this.isFaceDown
                        );
                    },

                    validTarget: function(stack) {
                        const target = stack.my_Last();

                        switch (stack.field) {
                            case "tableau":
                                if (!target) {
                                    return this.rank === 13;
                                } else {
                                    return (
                                        !target.isFaceDown &&
                                        target.color !== this.color &&
                                        target.rank === this.rank + 1
                                    );
                                }
                                break;
                            case "foundation":
                                if (!target) {
                                    return this.rank === 1;
                                } else {
                                    return (
                                        target.suit === this.suit &&
                                        target.rank === this.rank - 1
                                    );
                                }
                                break;
                            default:
                                return false;
                        }
                    },
                }),
            }));

        Y.Array.each(Yukon.fields, function(field) {
            Yukon[field].Stack = Solitaire.instance(Yukon.Stack);
        });

        Y.mix(
            Yukon.Stack,
            {
                validTarget: function(stack) {
                    return (
                        stack.field === "tableau" &&
                        this.first().validTarget(stack)
                    );
                },

                validProxy: function(card) {
                    return true;
                },
            },
            true,
        );

        Y.mix(
            Yukon.Tableau.Stack,
            {
                setCardPosition: function(card) {
                    return this.lastCardSetCardPosition(card);
                },
            },
            true,
        );
    },
    "0.0.1",
    { requires: ["solitaire"] },
);
