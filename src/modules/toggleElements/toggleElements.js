export function ToggleElements({ form }) {
    const defaults = {
        enabled: true,
        animate: true,
        animatedDuration: 300,
        container: '[data-form-toggle-container]',
        elements: {},
    }

    // const moduleCopy = { ...module };
    const toggleElementsModule = Object.assign({}, defaults, form);

    // Добавление обработчиков показа/скрытия блокам
    function init() {
        if (!Object.keys(toggleElementsModule.elements).length) {
            return form.logWarn('No elements in toggleElementsModule')
        };

        const elementsMap = makeShowingMap();
        toggleElementsModule.elements = new Map(elementsMap);

        for (const [elemToChange, elemToShow] of elementsMap) {
            addShowEvent(elemToChange, elemToShow)
        }

        // Возвращает объект Map()
        function makeShowingMap() {
            const map = new Map;

            Object.entries(toggleElementsModule.elements).forEach((elem) => {
                const [key, value] = elem;
                const getInputToClick = form.getElement(key);
                const getInputsToShow = Array.isArray(value) ? form.getElements(value) : [form.getElement(value)];

                const inputsToShow = getInputsToShow.map(inputToShow => {
                    const isHidden = inputToShow.hasClass('hide') || inputToShow.attr('display', 'none') ? true : false;
                    return {
                        inputToShow,
                        isHidden
                    }
                });

                map.set(getInputToClick, inputsToShow);
            });

            return map;
        }
    }

    // Обработчик показа/скрытия блока
    function addShowEvent($el, inputsToShow) {
        const { container, animate } = toggleElementsModule;
        console.log(inputsToShow);

        $el.off('change.show-sibling').on('change.show-sibling', (e) => {
            const $target = $(e.currentTarget);

            if (!inputsToShow.length) return form.logWarn('No elements to toggle');

            inputsToShow.forEach(obj => {
                const $elem = obj.inputToShow;
                const isHidden = obj.isHidden;

                console.log($elem, isHidden);

                if (!$elem) return form.logWarn('Error to identify toggle element');

                switch ($target.prop('type')) {
                    case 'checkbox':
                    case 'radio':
                        if ($target.is(':checked')) {
                            // $elem.closest(container).show();
                            toggleElement($elem);
                        }
                        else {
                            toggleElement($elem);
                            // $elem.closest(container).hide();
                        }
                        break;
                    case 'text':
                    case 'textarea':
                    case 'select-one':
                        console.log(isHidden);
                        toggleElement($elem);
                        console.log(inputsToShow[0].isHidden);
                        isHidden = !isHidden;
                        // if ($target.val() !== '') {
                        //     $elem.closest(container).show();
                        // } else {
                        //     $elem.closest(container).hide();
                        // }
                        break;
                    default:
                        // $elem.closest(container)[$target.val() !== '' ? 'show' : 'hide']();
                        break;
                }
            });
        })
    }

    function toggleElement($elem) {
        const { container, animate } = toggleElementsModule;
        const elemContainer = $elem.closest(container);
        const isHidden = elemContainer.hasClass('hide');

        if (animate) {
            animateToggle(elemContainer, isHidden);
        } else {
            isHidden ? elemContainer.removeClass('hide').show() : elemContainer.addClass('hide').hide();
        }
    }

    function animateToggle(elemContainer, isHidden) {
        const { animatedDuration } = toggleElementsModule;

        elemContainer.stop().animate({ height: 'toggle' }, {
            complete: () => {
                isHidden ? elemContainer.removeClass('hide').show() : elemContainer.addClass('hide').hide();
            },
            duration: animatedDuration
        });
    }

    return init();
}