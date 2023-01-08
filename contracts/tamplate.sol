// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.11;
library Pairing {
    struct G1Point { //create object
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2); // create object {1, 2}
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        ); // obj [[a, b], [c, d]]

    }
    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0); // если пришедший обьект с 0 и 0 то вернем  и 0
        return G1Point(p.X, q - (p.Y % q)); // если не так то вернем Х который был в обьекте и посчитаем Y по формуле из числа q
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input; // создали инпут арр с 4 элем
        input[0] = p1.X; // кладем х от первой переменной инпута 
        input[1] = p1.Y; // кладем у
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success; // создаем арр с 4мя переменными для сложения двух векторов мейби
        // solium-disable-next-line security/no-inline-assembly
        assembly {// код внутри это солидити асембли
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60) // честно говоря нихуя не понял, походу что-то для газа
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-add-failed");
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success; // походу создаем арр с 3 переменными для мультиплай вектора на число
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length; //колво элементов количество точек р1
        uint inputSize = elements * 6; //инпут сайз это 6раз колво элемен
        uint[] memory input = new uint[](inputSize); // создаем аррей с инпутсайзом 
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X; // идем по р1 берем Х и кладем в финальный арр
            input[i * 6 + 1] = p1[i].Y; // игрик в финальный арр
            input[i * 6 + 2] = p2[i].X[0]; // и кладем весь G2 тоже туда  
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly { // снова нихуя не понятно. ебучий солидити опять стал асембли
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-opcode-failed");
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2); // че блять не понимаю что за ()  
        G2Point[] memory p2 = new G2Point[](2); // 
        p1[0] = a1; // получается берем Х от а и У от б и кладем в один
        p1[1] = b1;
        p2[0] = a2; // тут так же ток с g2
        p2[1] = b2;
        return pairing(p1, p2); // потом шлем в паринг
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alfa1; // создаем переменные с типами от джипоинтов
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    struct Proof {// пруф это а б с с поинтами
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            3094828775517550525197566774110614793311731901097309624648333207761785087681,
            4973361633682654439731710783777857699866244736970939453813554145386550307527
        ); // создаем верифай ки
        vk.beta2 = Pairing.G2Point(
            [13499419113223668937021579779117131850345364653480320000177549271557150717374,
             11620659399480838044082293331182144703316076720555750892802148027134195201948],
            [18049605325992875447516611068172788214951498814093605221277443190359492293089,
             21521211693595528162713660636185959153067292182652600856396868902929580683072]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [21736251588786795834463926996850302823040560050017413579828421666093486115677,
             20487729238500761411286865321438208222595651741870518082039990228077672635811],
            [814362991425023327376155205421289762321636824124294100639375450278141916107,
             14653638796769091338807292843558027576398633425229200983640835820563515047962]
        );
        vk.IC = new Pairing.G1Point[](2);
        // это что-то типо аррея для джипоинтов 
        vk.IC[0] = Pairing.G1Point( 
            10168363029289562194171815371567707737027915763449537510564144979721400377107,
            19959253366839090641122107225335812779308542773818209482652804002231893979800
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            10521597501512296138789420188089172372732231786163980299150549715518141103662,
            3561469230793331133301554911538052267789789467669382491203061043140246987920
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey(); //это тот обьект который мы создали раньше 
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");  // какой-то тест походу я не ебу
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0); //vk_x это {X 0, Y 0}
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");// еще какая-то проверка 
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i])); // вызываем функции и че-то считаем 
        } // вк_х это переменная в которой походу добавляются числа че-то тудасюда  
        vk_x = Pairing.addition(vk_x, vk.IC[0]); // и еще разок добавили 
        if (!Pairing.pairingprod4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1; // потом делаем паринг прод3 и кладем туда все переменные
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyproof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[1] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);// делаем дпоинт из а
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);//делаем джипоинт2 из б
        proof.C = Pairing.G1Point(c[0], c[1]);//делаем джипоинт а из с
        uint[] memory inputValues = new uint[](input.length); //берем длину инпута
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i]; //раскладываем инпут на массив 
        }
        if (verify(inputValues, proof) == 0) {
            return true;// шлем в верифай все 
        } else {
            return false;
        }
    }
}

