import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, Palette, Users, TrendingUp } from 'lucide-react';

const Hero = () => {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  // 页面可见性API处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 支持多种格式的背景图片集合（包括WEBP、JPG格式）- 总计330张图片
  // 使用重命名后的正确文件路径，解决图片空白问题
  const backgroundImages = [
    { id: 1, src: '/ImageFlow/01-(1).webp', alt: '艺术图片 1' },
    { id: 2, src: '/ImageFlow/01-(2).webp', alt: '艺术图片 2' },
    { id: 3, src: '/ImageFlow/01-(3).webp', alt: '艺术图片 3' },
    { id: 4, src: '/ImageFlow/01-(4).webp', alt: '艺术图片 4' },
    { id: 5, src: '/ImageFlow/02-(1).webp', alt: '艺术图片 5' },
    { id: 6, src: '/ImageFlow/02-(2).webp', alt: '艺术图片 6' },
    { id: 7, src: '/ImageFlow/02-(3).webp', alt: '艺术图片 7' },
    { id: 8, src: '/ImageFlow/02-(4).webp', alt: '艺术图片 8' },
    { id: 9, src: '/ImageFlow/03.webp', alt: '艺术图片 9' },
    { id: 10, src: '/ImageFlow/04.webp', alt: '艺术图片 10' },
    { id: 11, src: '/ImageFlow/05.webp', alt: '艺术图片 11' },
    { id: 12, src: '/ImageFlow/06.webp', alt: '艺术图片 12' },
    { id: 13, src: '/ImageFlow/07-(1).webp', alt: '艺术图片 13' },
    { id: 14, src: '/ImageFlow/07-(2).webp', alt: '艺术图片 14' },
    { id: 15, src: '/ImageFlow/07-(3).webp', alt: '艺术图片 15' },
    { id: 16, src: '/ImageFlow/08.webp', alt: '艺术图片 16' },
    { id: 17, src: '/ImageFlow/09.webp', alt: '艺术图片 17' },
    { id: 18, src: '/ImageFlow/10.webp', alt: '艺术图片 18' },
    { id: 19, src: '/ImageFlow/11-(1).webp', alt: '艺术图片 19' },
    { id: 20, src: '/ImageFlow/11-(2).webp', alt: '艺术图片 20' },
    { id: 21, src: '/ImageFlow/12.webp', alt: '艺术图片 21' },
    { id: 22, src: '/ImageFlow/13.webp', alt: '艺术图片 22' },
    { id: 23, src: '/ImageFlow/15.webp', alt: '艺术图片 23' },
    { id: 24, src: '/ImageFlow/16-(1).webp', alt: '艺术图片 24' },
    { id: 25, src: '/ImageFlow/16-(2).webp', alt: '艺术图片 25' },
    { id: 26, src: '/ImageFlow/17-(1).webp', alt: '艺术图片 26' },
    { id: 27, src: '/ImageFlow/17-(2).webp', alt: '艺术图片 27' },
    { id: 28, src: '/ImageFlow/17-(3).webp', alt: '艺术图片 28' },
    { id: 29, src: '/ImageFlow/17-(4).webp', alt: '艺术图片 29' },
    { id: 30, src: '/ImageFlow/18.webp', alt: '艺术图片 30' },
    { id: 31, src: '/ImageFlow/19-(1).webp', alt: '艺术图片 31' },
    { id: 32, src: '/ImageFlow/19-(2).webp', alt: '艺术图片 32' },
    { id: 33, src: '/ImageFlow/20-(1).webp', alt: '艺术图片 33' },
    { id: 34, src: '/ImageFlow/20-(2).webp', alt: '艺术图片 34' },
    { id: 35, src: '/ImageFlow/20-(3).webp', alt: '艺术图片 35' },
    { id: 36, src: '/ImageFlow/21-(1).webp', alt: '艺术图片 36' },
    { id: 37, src: '/ImageFlow/21-(2).webp', alt: '艺术图片 37' },
    { id: 38, src: '/ImageFlow/22-(1).webp', alt: '艺术图片 38' },
    { id: 39, src: '/ImageFlow/22-(2).webp', alt: '艺术图片 39' },
    { id: 40, src: '/ImageFlow/23.webp', alt: '艺术图片 40' },
    { id: 41, src: '/ImageFlow/24.webp', alt: '艺术图片 41' },
    { id: 42, src: '/ImageFlow/25.webp', alt: '艺术图片 42' },
    { id: 43, src: '/ImageFlow/26-(1).webp', alt: '艺术图片 43' },
    { id: 44, src: '/ImageFlow/26-(2).webp', alt: '艺术图片 44' },
    { id: 45, src: '/ImageFlow/27.webp', alt: '艺术图片 45' },
    { id: 46, src: '/ImageFlow/28.webp', alt: '艺术图片 46' },
    { id: 47, src: '/ImageFlow/29.webp', alt: '艺术图片 47' },
    { id: 48, src: '/ImageFlow/30.webp', alt: '艺术图片 48' },
    { id: 49, src: '/ImageFlow/31-(1).webp', alt: '艺术图片 49' },
    { id: 50, src: '/ImageFlow/31-(2).webp', alt: '艺术图片 50' },
    { id: 51, src: '/ImageFlow/31-(3).webp', alt: '艺术图片 51' },
    { id: 52, src: '/ImageFlow/31-(4).webp', alt: '艺术图片 52' },
    { id: 53, src: '/ImageFlow/32.webp', alt: '艺术图片 53' },
    { id: 54, src: '/ImageFlow/33.webp', alt: '艺术图片 54' },
    { id: 55, src: '/ImageFlow/34.webp', alt: '艺术图片 55' },
    { id: 56, src: '/ImageFlow/35.webp', alt: '艺术图片 56' },
    { id: 57, src: '/ImageFlow/36-(1).webp', alt: '艺术图片 57' },
    { id: 58, src: '/ImageFlow/36-(2).webp', alt: '艺术图片 58' },
    { id: 59, src: '/ImageFlow/37-(1).webp', alt: '艺术图片 59' },
    { id: 60, src: '/ImageFlow/37-(2).webp', alt: '艺术图片 60' },
    { id: 61, src: '/ImageFlow/38-(1).webp', alt: '艺术图片 61' },
    { id: 62, src: '/ImageFlow/38-(2).webp', alt: '艺术图片 62' },
    { id: 63, src: '/ImageFlow/39.webp', alt: '艺术图片 63' },
    { id: 64, src: '/ImageFlow/40-(1).webp', alt: '艺术图片 64' },
    { id: 65, src: '/ImageFlow/40-(2).webp', alt: '艺术图片 65' },
    { id: 66, src: '/ImageFlow/40-(3).webp', alt: '艺术图片 66' },
    { id: 67, src: '/ImageFlow/41-(1).webp', alt: '艺术图片 67' },
    { id: 68, src: '/ImageFlow/41-(2).webp', alt: '艺术图片 68' },
    { id: 69, src: '/ImageFlow/42-(1).webp', alt: '艺术图片 69' },
    { id: 70, src: '/ImageFlow/42-(2).webp', alt: '艺术图片 70' },
    { id: 71, src: '/ImageFlow/42-(3).webp', alt: '艺术图片 71' },
    { id: 72, src: '/ImageFlow/42-(4).webp', alt: '艺术图片 72' },
    { id: 73, src: '/ImageFlow/43-(1).webp', alt: '艺术图片 73' },
    { id: 74, src: '/ImageFlow/43-(2).webp', alt: '艺术图片 74' },
    { id: 75, src: '/ImageFlow/43-(3).webp', alt: '艺术图片 75' },
    { id: 76, src: '/ImageFlow/44-(1).webp', alt: '艺术图片 76' },
    { id: 77, src: '/ImageFlow/44-(2).webp', alt: '艺术图片 77' },
    { id: 78, src: '/ImageFlow/44-(3).webp', alt: '艺术图片 78' },
    { id: 79, src: '/ImageFlow/44-(4).webp', alt: '艺术图片 79' },
    { id: 80, src: '/ImageFlow/45-(1).webp', alt: '艺术图片 80' },
    { id: 81, src: '/ImageFlow/45-(2).webp', alt: '艺术图片 81' },
    { id: 82, src: '/ImageFlow/45-(3).webp', alt: '艺术图片 82' },
    { id: 83, src: '/ImageFlow/45-(4).webp', alt: '艺术图片 83' },
    { id: 84, src: '/ImageFlow/46-(1).webp', alt: '艺术图片 84' },
    { id: 85, src: '/ImageFlow/46-(2).webp', alt: '艺术图片 85' },
    { id: 86, src: '/ImageFlow/46-(3).webp', alt: '艺术图片 86' },
    { id: 87, src: '/ImageFlow/46-(4).webp', alt: '艺术图片 87' },
    { id: 88, src: '/ImageFlow/47-(1).webp', alt: '艺术图片 88' },
    { id: 89, src: '/ImageFlow/47-(2).webp', alt: '艺术图片 89' },
    { id: 90, src: '/ImageFlow/47-(3).webp', alt: '艺术图片 90' },
    { id: 91, src: '/ImageFlow/47-(4).webp', alt: '艺术图片 91' },
    { id: 92, src: '/ImageFlow/48-(1).webp', alt: '艺术图片 92' },
    { id: 93, src: '/ImageFlow/48-(2).webp', alt: '艺术图片 93' },
    { id: 94, src: '/ImageFlow/48-(3).webp', alt: '艺术图片 94' },
    { id: 95, src: '/ImageFlow/48-(4).webp', alt: '艺术图片 95' },
    { id: 96, src: '/ImageFlow/49-(2).webp', alt: '艺术图片 96' },
    { id: 97, src: '/ImageFlow/49-(3).webp', alt: '艺术图片 97' },
    { id: 98, src: '/ImageFlow/49-(4).webp', alt: '艺术图片 98' },
    { id: 99, src: '/ImageFlow/49.webp', alt: '艺术图片 99' },
    { id: 100, src: '/ImageFlow/50-(1).webp', alt: '艺术图片 100' },
    { id: 101, src: '/ImageFlow/50-(2).webp', alt: '艺术图片 101' },
    { id: 102, src: '/ImageFlow/51-(1).webp', alt: '艺术图片 102' },
    { id: 103, src: '/ImageFlow/51-(2).webp', alt: '艺术图片 103' },
    { id: 104, src: '/ImageFlow/51-(3).webp', alt: '艺术图片 104' },
    { id: 105, src: '/ImageFlow/51-(4).webp', alt: '艺术图片 105' },
    { id: 106, src: '/ImageFlow/52-(1).webp', alt: '艺术图片 106' },
    { id: 107, src: '/ImageFlow/52-(2).webp', alt: '艺术图片 107' },
    { id: 108, src: '/ImageFlow/52-(3).webp', alt: '艺术图片 108' },
    { id: 109, src: '/ImageFlow/52-(4).webp', alt: '艺术图片 109' },
    { id: 110, src: '/ImageFlow/53-(1).webp', alt: '艺术图片 110' },
    { id: 111, src: '/ImageFlow/53-(2).webp', alt: '艺术图片 111' },
    { id: 112, src: '/ImageFlow/53-(3).webp', alt: '艺术图片 112' },
    { id: 113, src: '/ImageFlow/58-(1).webp', alt: '艺术图片 113' },
    { id: 114, src: '/ImageFlow/58-(2).webp', alt: '艺术图片 114' },
    { id: 115, src: '/ImageFlow/58-(3).webp', alt: '艺术图片 115' },
    { id: 116, src: '/ImageFlow/58-(4).webp', alt: '艺术图片 116' },
    { id: 117, src: '/ImageFlow/59-(1).webp', alt: '艺术图片 117' },
    { id: 118, src: '/ImageFlow/59-(2).webp', alt: '艺术图片 118' },
    { id: 119, src: '/ImageFlow/59-(3).webp', alt: '艺术图片 119' },
    { id: 120, src: '/ImageFlow/59-(4).webp', alt: '艺术图片 120' },
    { id: 121, src: '/ImageFlow/60-(1).webp', alt: '艺术图片 121' },
    { id: 122, src: '/ImageFlow/60-(2).webp', alt: '艺术图片 122' },
    { id: 123, src: '/ImageFlow/60-(3).webp', alt: '艺术图片 123' },
    { id: 124, src: '/ImageFlow/60-(4).webp', alt: '艺术图片 124' },
    { id: 125, src: '/ImageFlow/61-(1).webp', alt: '艺术图片 125' },
    { id: 126, src: '/ImageFlow/61-(2).webp', alt: '艺术图片 126' },
    { id: 127, src: '/ImageFlow/61-(3).webp', alt: '艺术图片 127' },
    { id: 128, src: '/ImageFlow/61-(4).webp', alt: '艺术图片 128' },
    { id: 129, src: '/ImageFlow/62-(1).webp', alt: '艺术图片 129' },
    { id: 130, src: '/ImageFlow/62-(2).webp', alt: '艺术图片 130' },
    { id: 131, src: '/ImageFlow/62-(3).webp', alt: '艺术图片 131' },
    { id: 132, src: '/ImageFlow/62-(4).webp', alt: '艺术图片 132' },
    { id: 133, src: '/ImageFlow/63-(1).webp', alt: '艺术图片 133' },
    { id: 134, src: '/ImageFlow/63-(2).webp', alt: '艺术图片 134' },
    { id: 135, src: '/ImageFlow/63-(3).webp', alt: '艺术图片 135' },
    { id: 136, src: '/ImageFlow/63-(4).webp', alt: '艺术图片 136' },
    { id: 137, src: '/ImageFlow/64-(1).webp', alt: '艺术图片 137' },
    { id: 138, src: '/ImageFlow/64-(2).webp', alt: '艺术图片 138' },
    { id: 139, src: '/ImageFlow/64-(3).webp', alt: '艺术图片 139' },
    { id: 140, src: '/ImageFlow/64-(4).webp', alt: '艺术图片 140' },
    { id: 141, src: '/ImageFlow/65-(1).webp', alt: '艺术图片 141' },
    { id: 142, src: '/ImageFlow/65-(2).webp', alt: '艺术图片 142' },
    { id: 143, src: '/ImageFlow/65-(3).webp', alt: '艺术图片 143' },
    { id: 144, src: '/ImageFlow/65-(4).webp', alt: '艺术图片 144' },
    { id: 145, src: '/ImageFlow/66-(1).webp', alt: '艺术图片 145' },
    { id: 146, src: '/ImageFlow/66-(2).webp', alt: '艺术图片 146' },
    { id: 147, src: '/ImageFlow/66-(3).webp', alt: '艺术图片 147' },
    { id: 148, src: '/ImageFlow/66-(4).webp', alt: '艺术图片 148' },
    { id: 149, src: '/ImageFlow/67-(1).webp', alt: '艺术图片 149' },
    { id: 150, src: '/ImageFlow/67-(2).webp', alt: '艺术图片 150' },
    { id: 151, src: '/ImageFlow/67-(3).webp', alt: '艺术图片 151' },
    { id: 152, src: '/ImageFlow/67-(4).webp', alt: '艺术图片 152' },
    { id: 153, src: '/ImageFlow/68-(1).webp', alt: '艺术图片 153' },
    { id: 154, src: '/ImageFlow/68-(2).webp', alt: '艺术图片 154' },
    { id: 155, src: '/ImageFlow/68-(3).webp', alt: '艺术图片 155' },
    { id: 156, src: '/ImageFlow/68-(4).webp', alt: '艺术图片 156' },
    { id: 157, src: '/ImageFlow/69-(1).webp', alt: '艺术图片 157' },
    { id: 158, src: '/ImageFlow/69-(2).webp', alt: '艺术图片 158' },
    { id: 159, src: '/ImageFlow/69-(3).webp', alt: '艺术图片 159' },
    { id: 160, src: '/ImageFlow/69-(4).webp', alt: '艺术图片 160' },
    { id: 161, src: '/ImageFlow/70-(1).webp', alt: '艺术图片 161' },
    { id: 162, src: '/ImageFlow/70-(2).webp', alt: '艺术图片 162' },
    { id: 163, src: '/ImageFlow/70-(3).webp', alt: '艺术图片 163' },
    { id: 164, src: '/ImageFlow/70-(4).webp', alt: '艺术图片 164' },
    { id: 165, src: '/ImageFlow/71-(1).webp', alt: '艺术图片 165' },
    { id: 166, src: '/ImageFlow/71-(2).webp', alt: '艺术图片 166' },
    { id: 167, src: '/ImageFlow/71-(3).webp', alt: '艺术图片 167' },
    { id: 168, src: '/ImageFlow/71-(4).webp', alt: '艺术图片 168' },
    { id: 169, src: '/ImageFlow/72-(1).webp', alt: '艺术图片 169' },
    { id: 170, src: '/ImageFlow/72-(2).webp', alt: '艺术图片 170' },
    { id: 171, src: '/ImageFlow/72-(3).webp', alt: '艺术图片 171' },
    { id: 172, src: '/ImageFlow/72-(4).webp', alt: '艺术图片 172' },
    { id: 173, src: '/ImageFlow/73-(1).webp', alt: '艺术图片 173' },
    { id: 174, src: '/ImageFlow/73-(2).webp', alt: '艺术图片 174' },
    { id: 175, src: '/ImageFlow/73-(3).webp', alt: '艺术图片 175' },
    { id: 176, src: '/ImageFlow/73-(4).webp', alt: '艺术图片 176' },
    { id: 177, src: '/ImageFlow/74-(1).webp', alt: '艺术图片 177' },
    { id: 178, src: '/ImageFlow/74-(2).webp', alt: '艺术图片 178' },
    { id: 179, src: '/ImageFlow/74-(3).webp', alt: '艺术图片 179' },
    { id: 180, src: '/ImageFlow/74-(4).webp', alt: '艺术图片 180' },
    { id: 181, src: '/ImageFlow/75-(1).webp', alt: '艺术图片 181' },
    { id: 182, src: '/ImageFlow/75-(2).webp', alt: '艺术图片 182' },
    { id: 183, src: '/ImageFlow/75-(3).webp', alt: '艺术图片 183' },
    { id: 184, src: '/ImageFlow/75-(4).webp', alt: '艺术图片 184' },
    { id: 185, src: '/ImageFlow/76-(1).webp', alt: '艺术图片 185' },
    { id: 186, src: '/ImageFlow/76-(2).webp', alt: '艺术图片 186' },
    { id: 187, src: '/ImageFlow/76-(3).webp', alt: '艺术图片 187' },
    { id: 188, src: '/ImageFlow/76-(4).webp', alt: '艺术图片 188' },
    { id: 189, src: '/ImageFlow/77-(1).webp', alt: '艺术图片 189' },
    { id: 190, src: '/ImageFlow/77-(2).webp', alt: '艺术图片 190' },
    { id: 191, src: '/ImageFlow/77-(3).webp', alt: '艺术图片 191' },
    { id: 192, src: '/ImageFlow/77-(4).webp', alt: '艺术图片 192' },
    { id: 193, src: '/ImageFlow/78-(1).webp', alt: '艺术图片 193' },
    { id: 194, src: '/ImageFlow/78-(2).webp', alt: '艺术图片 194' },
    { id: 195, src: '/ImageFlow/78-(3).webp', alt: '艺术图片 195' },
    { id: 196, src: '/ImageFlow/78-(4).webp', alt: '艺术图片 196' },
    { id: 197, src: '/ImageFlow/79-(1).webp', alt: '艺术图片 197' },
    { id: 198, src: '/ImageFlow/79-(2).webp', alt: '艺术图片 198' },
    { id: 199, src: '/ImageFlow/79-(3).webp', alt: '艺术图片 199' },
    { id: 200, src: '/ImageFlow/79-(4).webp', alt: '艺术图片 200' },
    { id: 201, src: '/ImageFlow/80-(1).webp', alt: '艺术图片 201' },
    { id: 202, src: '/ImageFlow/80-(2).webp', alt: '艺术图片 202' },
    { id: 203, src: '/ImageFlow/80-(3).webp', alt: '艺术图片 203' },
    { id: 204, src: '/ImageFlow/80-(4).webp', alt: '艺术图片 204' },
    { id: 205, src: '/ImageFlow/81-(1).webp', alt: '艺术图片 205' },
    { id: 206, src: '/ImageFlow/81-(2).webp', alt: '艺术图片 206' },
    { id: 207, src: '/ImageFlow/81-(3).webp', alt: '艺术图片 207' },
    { id: 208, src: '/ImageFlow/81-(4).webp', alt: '艺术图片 208' },
    { id: 209, src: '/ImageFlow/82-(1).webp', alt: '艺术图片 209' },
    { id: 210, src: '/ImageFlow/82-(2).webp', alt: '艺术图片 210' },
    { id: 211, src: '/ImageFlow/82-(3).webp', alt: '艺术图片 211' },
    { id: 212, src: '/ImageFlow/82-(4).webp', alt: '艺术图片 212' },
    { id: 213, src: '/ImageFlow/83-(1).webp', alt: '艺术图片 213' },
    { id: 214, src: '/ImageFlow/83-(2).webp', alt: '艺术图片 214' },
    { id: 215, src: '/ImageFlow/83-(3).webp', alt: '艺术图片 215' },
    { id: 216, src: '/ImageFlow/83-(4).webp', alt: '艺术图片 216' },
    { id: 217, src: '/ImageFlow/84-(1).webp', alt: '艺术图片 217' },
    { id: 218, src: '/ImageFlow/84-(2).webp', alt: '艺术图片 218' },
    { id: 219, src: '/ImageFlow/84-(3).webp', alt: '艺术图片 219' },
    { id: 220, src: '/ImageFlow/84-(4).webp', alt: '艺术图片 220' },
    { id: 221, src: '/ImageFlow/85-(1).webp', alt: '艺术图片 221' },
    { id: 222, src: '/ImageFlow/85-(2).webp', alt: '艺术图片 222' },
    { id: 223, src: '/ImageFlow/85-(3).webp', alt: '艺术图片 223' },
    { id: 224, src: '/ImageFlow/85-(4).webp', alt: '艺术图片 224' },
    { id: 225, src: '/ImageFlow/86-(1).webp', alt: '艺术图片 225' },
    { id: 226, src: '/ImageFlow/86-(2).webp', alt: '艺术图片 226' },
    { id: 227, src: '/ImageFlow/86-(3).webp', alt: '艺术图片 227' },
    { id: 228, src: '/ImageFlow/86-(4).webp', alt: '艺术图片 228' },
    { id: 229, src: '/ImageFlow/87-(1).webp', alt: '艺术图片 229' },
    { id: 230, src: '/ImageFlow/87-(2).webp', alt: '艺术图片 230' },
    { id: 231, src: '/ImageFlow/87-(3).webp', alt: '艺术图片 231' },
    { id: 232, src: '/ImageFlow/87-(4).webp', alt: '艺术图片 232' },
    { id: 233, src: '/ImageFlow/0001111.webp', alt: '艺术图片 233' },
    { id: 234, src: '/ImageFlow/Gq6_erGXsAAHFYP.jpg', alt: 'JPG图片 234' },
    { id: 235, src: '/ImageFlow/Gq6_erYW8AAIoqH.jpg', alt: 'JPG图片 235' },
    { id: 236, src: '/ImageFlow/Gqcdbu2W0AAjH8a.jpg', alt: 'JPG图片 236' },
    { id: 237, src: '/ImageFlow/GqcdjxOXYAAF-6k.jpg', alt: 'JPG图片 237' },
    { id: 238, src: '/ImageFlow/GqceNngXgAAcY5h.jpg', alt: 'JPG图片 238' },
    { id: 239, src: '/ImageFlow/GqcfMbIWQAAwv0_.jpg', alt: 'JPG图片 239' },
    { id: 240, src: '/ImageFlow/GqxX6iPXMAAVdpR.jpg', alt: 'JPG图片 240' },
    { id: 241, src: '/ImageFlow/GqxXfJtXcAEX5u0.jpg', alt: 'JPG图片 241' },
    { id: 242, src: '/ImageFlow/GqxXwMLWIAAZ4Nz.jpg', alt: 'JPG图片 242' },
    { id: 243, src: '/ImageFlow/GqxZBPQWYAAKNKB.jpg', alt: 'JPG图片 243' },
    { id: 244, src: '/ImageFlow/Gu2QB3la4AAf8N5.jpg', alt: 'JPG图片 244' },
    { id: 245, src: '/ImageFlow/Gu2QBi7bkAAuapw.jpg', alt: 'JPG图片 245' },
    { id: 246, src: '/ImageFlow/Gu7aESnbAAAjJe1.jpg', alt: 'JPG图片 246' },
    { id: 247, src: '/ImageFlow/GucgS5kbgAAZNAn.jpg', alt: 'JPG图片 247' },
    { id: 248, src: '/ImageFlow/GucgSkPbEAAe1sZ.jpg', alt: 'JPG图片 248' },
    { id: 249, src: '/ImageFlow/GuH57djbYAAmctE.jpg', alt: 'JPG图片 249' },
    { id: 250, src: '/ImageFlow/GuH57E3bAAAqTa_.jpg', alt: 'JPG图片 250' },
    { id: 251, src: '/ImageFlow/GuH57oEb0AETQib.jpg', alt: 'JPG图片 251' },
    { id: 252, src: '/ImageFlow/GuH57RIbMAAUpw3.jpg', alt: 'JPG图片 252' },
    { id: 253, src: '/ImageFlow/GuhqG3yaoAIgFPi.jpg', alt: 'JPG图片 253' },
    { id: 254, src: '/ImageFlow/GuhqGhyaoAUHMli.jpg', alt: 'JPG图片 254' },
    { id: 255, src: '/ImageFlow/GumzC2laYAAYF43.jpg', alt: 'JPG图片 255' },
    { id: 256, src: '/ImageFlow/Gur7e_kaQAA4ck7.jpg', alt: 'JPG图片 256' },
    { id: 257, src: '/ImageFlow/Gur7fdka4AAiSbs.jpg', alt: 'JPG图片 257' },
    { id: 258, src: '/ImageFlow/Gur7fJ7aAAAYQue.jpg', alt: 'JPG图片 258' },
    { id: 259, src: '/ImageFlow/Gur7fTTaIAAmTHd.jpg', alt: 'JPG图片 259' },
    { id: 260, src: '/ImageFlow/Gv0Djd6aQAEH3S9.jpg', alt: 'JPG图片 260' },
    { id: 261, src: '/ImageFlow/Gv1Ktm9WMAApFiw.jpg', alt: 'JPG图片 261' },
    { id: 262, src: '/ImageFlow/Gv1KtYIWMAUsrLV.jpg', alt: 'JPG图片 262' },
    { id: 263, src: '/ImageFlow/Gv2BpbkWoAAb3aE.jpg', alt: 'JPG图片 263' },
    { id: 264, src: '/ImageFlow/Gv4Hl5NXsAAKySz.jpg', alt: 'JPG图片 264' },
    { id: 265, src: '/ImageFlow/Gv4HlczXkAA4Fad.jpg', alt: 'JPG图片 265' },
    { id: 266, src: '/ImageFlow/Gv4HlLXXkAAijLW.jpg', alt: 'JPG图片 266' },
    { id: 267, src: '/ImageFlow/Gv4HlrFXoAAxwri.jpg', alt: 'JPG图片 267' },
    { id: 268, src: '/ImageFlow/Gv4p3s3XMAEemEi.jpg', alt: 'JPG图片 268' },
    { id: 269, src: '/ImageFlow/Gv4p4ITWEAAUA0m.jpg', alt: 'JPG图片 269' },
    { id: 270, src: '/ImageFlow/Gv4p4T7XQAAFFhv.jpg', alt: 'JPG图片 270' },
    { id: 271, src: '/ImageFlow/Gv7LO78WkAASVvN.jpg', alt: 'JPG图片 271' },
    { id: 272, src: '/ImageFlow/Gv51s9BbQAAVo-D.jpg', alt: 'JPG图片 272' },
    { id: 273, src: '/ImageFlow/Gv51tIpbUAAbTcd.jpg', alt: 'JPG图片 273' },
    { id: 274, src: '/ImageFlow/GvAjbNIaMAAlgPs.jpg', alt: 'JPG图片 274' },
    { id: 275, src: '/ImageFlow/GvaSO7WbcAAqK1.jpg', alt: 'JPG图片 275' },
    { id: 276, src: '/ImageFlow/GvjhLhxXcAEdBIg.jpg', alt: 'JPG图片 276' },
    { id: 277, src: '/ImageFlow/GvjhLUwW4AAZ76p.jpg', alt: 'JPG图片 277' },
    { id: 278, src: '/ImageFlow/GvjhLvUWcAAS0oT.jpg', alt: 'JPG图片 278' },
    { id: 279, src: '/ImageFlow/GvmJaXRXcAA_tge.jpg', alt: 'JPG图片 279' },
    { id: 280, src: '/ImageFlow/GvmJZ7IWQAAkXyf.jpg', alt: 'JPG图片 280' },
    { id: 281, src: '/ImageFlow/GvurY1BbEAAYMrZ.jpg', alt: 'JPG图片 281' },
    { id: 282, src: '/ImageFlow/GvVJyFsbMAAFqO_.jpg', alt: 'JPG图片 282' },
    { id: 283, src: '/ImageFlow/GvVJyhuaYAMG94a.jpg', alt: 'JPG图片 283' },
    { id: 284, src: '/ImageFlow/GvwBH3JXMAAZ1fw.jpg', alt: 'JPG图片 284' },
    { id: 285, src: '/ImageFlow/GvwBIIfWYAAvcXs.jpg', alt: 'JPG图片 285' },
    { id: 286, src: '/ImageFlow/GvwBIYbWcAA7ofr.jpg', alt: 'JPG图片 286' },
    { id: 287, src: '/ImageFlow/GvWoI6FXEAAEGz3.jpg', alt: 'JPG图片 287' },
    { id: 288, src: '/ImageFlow/GvWoI7AWsAApcLa.jpg', alt: 'JPG图片 288' },
    { id: 289, src: '/ImageFlow/GvWVgNOXAA0ytGq.jpg', alt: 'JPG图片 289' },
    { id: 290, src: '/ImageFlow/Gvy98oYWMAAh-Sl.jpg', alt: 'JPG图片 290' },
    { id: 291, src: '/ImageFlow/Gw4K0b4WAAAYPbH.jpg', alt: 'JPG图片 291' },
    { id: 292, src: '/ImageFlow/Gw4K0CbXoAAb-Ar.jpg', alt: 'JPG图片 292' },
    { id: 293, src: '/ImageFlow/Gw4K0OCXUAAa8o9.jpg', alt: 'JPG图片 293' },
    { id: 294, src: '/ImageFlow/Gw4Kz1CXcAAls62.jpg', alt: 'JPG图片 294' },
    { id: 295, src: '/ImageFlow/Gw7EO3FXMAAAJd1.jpg', alt: 'JPG图片 295' },
    { id: 296, src: '/ImageFlow/Gw7EObaXAAAUhT9.jpg', alt: 'JPG图片 296' },
    { id: 297, src: '/ImageFlow/Gw7EOLoXUAAhilH.jpg', alt: 'JPG图片 297' },
    { id: 298, src: '/ImageFlow/Gw7EOoHXQAABmXh.jpg', alt: 'JPG图片 298' },
    { id: 299, src: '/ImageFlow/Gw-rO6hWQAAKnwS.jpg', alt: 'JPG图片 299' },
    { id: 300, src: '/ImageFlow/GwDfjbEaIAAAM8Y.jpg', alt: 'JPG图片 300' },
    { id: 301, src: '/ImageFlow/GwDfjRAawAAdWAe.jpg', alt: 'JPG图片 301' },
    { id: 302, src: '/ImageFlow/GwEJdZvXMAAPFwO.jpg', alt: 'JPG图片 302' },
    { id: 303, src: '/ImageFlow/GwEJemrXYAAUgJ_.jpg', alt: 'JPG图片 303' },
    { id: 304, src: '/ImageFlow/Gwh-1-GXoAAJjki.jpg', alt: 'JPG图片 304' },
    { id: 305, src: '/ImageFlow/GwINamzW4AAwgd_.jpg', alt: 'JPG图片 305' },
    { id: 306, src: '/ImageFlow/GwIRG_vWAAAq9G0.jpg', alt: 'JPG图片 306' },
    { id: 307, src: '/ImageFlow/GwIRGQiWwAAHCf1.jpg', alt: 'JPG图片 307' },
    { id: 308, src: '/ImageFlow/GwIRH2aXIAAJPn9.jpg', alt: 'JPG图片 308' },
    { id: 309, src: '/ImageFlow/GwIRIisXsAAJTQu.jpg', alt: 'JPG图片 309' },
    { id: 310, src: '/ImageFlow/GwNxqavbsAAPIWv.jpg', alt: 'JPG图片 310' },
    { id: 311, src: '/ImageFlow/GwNxqnQbcAAXPKU.jpg', alt: 'JPG图片 311' },
    { id: 312, src: '/ImageFlow/GwOAVyLWUAMoXD9.jpg', alt: 'JPG图片 312' },
    { id: 313, src: '/ImageFlow/GwsszbTbgAIYPzX.jpg', alt: 'JPG图片 313' },
    { id: 314, src: '/ImageFlow/GwsszPNbgAEword.jpg', alt: 'JPG图片 314' },
    { id: 315, src: '/ImageFlow/GwsszwSbgAE8pcK.jpg', alt: 'JPG图片 315' },
    { id: 316, src: '/ImageFlow/GxBV_VPWsAE8uRV.jpg', alt: 'JPG图片 316' },
    { id: 317, src: '/ImageFlow/GxBWAUAXwAAyrCT.jpg', alt: 'JPG图片 317' },
    { id: 318, src: '/ImageFlow/GxBWBZsWsAAFAgk.jpg', alt: 'JPG图片 318' },
    { id: 319, src: '/ImageFlow/GxGcjHTa0AEWD5u.jpg', alt: 'JPG图片 319' },
    { id: 320, src: '/ImageFlow/GZ8pBUEWkAAn5Z0.jpg', alt: 'JPG图片 320' },
    { id: 321, src: '/ImageFlow/GZ8pBUFWMAAu4GE.jpg', alt: 'JPG图片 321' },
    { id: 322, src: '/ImageFlow/GZ8pBUHW4AA2gxN.jpg', alt: 'JPG图片 322' },
    { id: 323, src: '/ImageFlow/GZ8ptTwW0AAMUiC.jpg', alt: 'JPG图片 323' },
    { id: 324, src: '/ImageFlow/image_001.webp', alt: '艺术图片 324' },
    { id: 325, src: '/ImageFlow/image_002.webp', alt: '艺术图片 325' },
    { id: 326, src: '/ImageFlow/image_003.webp', alt: '艺术图片 326' },
    { id: 327, src: '/ImageFlow/image_004.webp', alt: '艺术图片 327' },
    { id: 328, src: '/ImageFlow/image_005.webp', alt: '艺术图片 328' },
    { id: 329, src: '/ImageFlow/image_006.webp', alt: '艺术图片 329' },
    { id: 330, src: '/ImageFlow/image_007.webp', alt: '艺术图片 330' }
  ];

  // 将图片分组为列（每列3张图片，填满背景高度）
  const createImageColumns = (imageArray) => {
    const columns = [];
    for (let i = 0; i < imageArray.length; i += 3) {
      const columnImages = imageArray.slice(i, i + 3);
      // 如果最后一列图片不足3张，用前面的图片补齐
      while (columnImages.length < 3) {
        const fillIndex = columnImages.length % imageArray.length;
        columnImages.push(imageArray[fillIndex]);
      }
      columns.push(columnImages);
    }
    console.log(`创建了 ${columns.length} 列，每列 ${columns[0]?.length || 0} 张图片`);
    return columns;
  };

  const imageColumns = createImageColumns(backgroundImages);
  const duplicatedColumns = [...imageColumns, ...imageColumns];



  // CSS动画定义（参考指南文档优化参数）
  const animations = `
    @keyframes scroll-left {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    
    .animate-scroll-hero {
      animation: scroll-left 180s linear infinite;
    }
    
    .animate-paused {
      animation-play-state: paused;
    }
    
    .animate-force-running {
      animation-play-state: running !important;
    }
  `;
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 sm:py-32">
      {/* 注入CSS动画 */}
      <style>{animations}</style>
      
      {/* 流动图片背景 */}
      <div 
        className="absolute inset-0 opacity-40"
      >
        <div 
          ref={wrapperRef} 
          className={`flex absolute top-0 left-0 h-full w-[200%] animate-scroll-hero ${isVisible ? 'animate-force-running' : ''}`}
        >
          {duplicatedColumns.map((column, columnIndex) => (
            <div 
              key={columnIndex} 
              className="w-[180px] h-full flex-shrink-0 flex flex-col mr-[1px]"
            >
              {column.map((image, imageIndex) => (
                <div 
                  key={`${columnIndex}-${imageIndex}`} 
                  className="w-[180px] flex-1 p-0.5"
                  style={{ minHeight: '33.33%' }}
                >
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                    loading="lazy"
                    style={{ imageRendering: 'crisp-edges' }}
                    onError={(e) => {
                      // 图片加载失败时显示占位符，而不是隐藏
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDE4MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik05MCA2MEM5NCA2MCA5NyA1NyA5NyA1M0M5NyA0OSA5NCA0NiA5MCA0NkM4NiA0NiA4MyA0OSA4MyA1M0M4MyA1NyA4NiA2MCA5MCA2MFoiIGZpbGw9IiNkMWQ1ZGIiLz4KPHBhdGggZD0iTTcwIDgwTDkwIDYwTDExMCA4MEgxNDBWMTAwSDQwVjgwSDcwWiIgZmlsbD0iI2QxZDVkYiIvPgo8L3N2Zz4K';
                      e.target.style.opacity = '0.3';
                      console.warn(`背景图片加载失败: ${image.src}`);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* 渐变遮罩层 */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/30 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-primary-500" />
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse-slow"></div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
              <span className="gradient-text">III.PICS</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-700">
                {t('home.hero.title', '专业AI视觉艺术平台')}
              </span>
            </h1>
            
            <div className="mb-4">
              <p className="text-2xl sm:text-3xl font-semibold text-primary-600 mb-2">
                Inspire • Imagine • Innovate
              </p>
              <p className="text-lg sm:text-xl text-slate-500">
                激发灵感 • 释放想象 • 推动创新
              </p>
            </div>
            
            <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              {t('home.hero.subtitle', '汇聚全球创作者的精美作品，发现无限创意可能，探索AI艺术的无限魅力')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              to="/create"
              className="btn btn-primary text-lg px-8 py-4 group"
            >
              {t('home.hero.createButton')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              to="/explore"
              className="btn btn-secondary text-lg px-8 py-4"
            >
              {t('home.hero.exploreButton')}
            </Link>
          </motion.div>

          {/* 特色数据 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">10K+</div>
              <div className="text-slate-600">{t('home.hero.stats.posts')}</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">5K+</div>
              <div className="text-slate-600">{t('home.hero.stats.users')}</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">100K+</div>
              <div className="text-slate-600">{t('home.hero.stats.shares')}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;