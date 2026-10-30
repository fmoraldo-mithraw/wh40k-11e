<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<gameSystem xmlns="http://www.battlescribe.net/schema/gameSystemSchema" id="sys-352e-adc2-7639-d6a9" name="Warhammer 40,000 10th Edition" revision="118" battleScribeVersion="2.03" type="gameSystem">
  <publications>
    <publication id="48fc-15aa-b307-9443" name="10th Edition Core Rules" shortName="10th Ed Core"/>
    <publication name="Github" hidden="false" id="8db3-575d-91b-47f8" shortName="BSData/wh40k-10e" publisherUrl="https://github.com/BSData/wh40k-10e"/>
  </publications>
  <costTypes>
    <costType id="51b2-306e-1021-d207" name="pts" defaultCostLimit="-1" hidden="false"/>
    <costType id="0d99-4ee2-7b3c-1f5a" name="DP" defaultCostLimit="-1" hidden="false">
      <comment>Detachment Points. In 11th edition each Detachment has a points cost paid from the army&apos;s Detachment Points budget.</comment>
    </costType>
  </costTypes>
  <profileTypes>
    <profileType id="c547-1836-d8a-ff4f" name="Unit">
      <characteristicTypes>
        <characteristicType id="e703-ecb6-5ce7-aec1" name="M"/>
        <characteristicType id="d29d-cf75-fc2d-34a4" name="T"/>
        <characteristicType id="450-a17e-9d5e-29da" name="SV"/>
        <characteristicType id="750a-a2ec-90d3-21fe" name="W"/>
        <characteristicType id="58d2-b879-49c7-43bc" name="LD"/>
        <characteristicType id="bef7-942a-1a23-59f8" name="OC"/>
      </characteristicTypes>
    </profileType>
    <profileType id="f77d-b953-8fa4-b762" name="Ranged Weapons">
      <characteristicTypes>
        <characteristicType id="9896-9419-16a1-92fc" name="Range"/>
        <characteristicType id="3bb-c35f-f54-fb08" name="A"/>
        <characteristicType id="94d-8a98-cf90-183e" name="BS"/>
        <characteristicType id="2229-f494-25db-c5d3" name="S"/>
        <characteristicType id="9ead-8a10-520-de15" name="AP"/>
        <characteristicType id="a354-c1c8-a745-f9e3" name="D"/>
        <characteristicType id="7f1b-8591-2fcf-d01c" name="Keywords"/>
      </characteristicTypes>
    </profileType>
    <profileType id="9cc3-6d83-4dd3-9b64" name="Abilities">
      <characteristicTypes>
        <characteristicType id="9b8f-694b-e5e-b573" name="Description"/>
      </characteristicTypes>
    </profileType>
    <profileType id="8a40-4aaa-c780-9046" name="Melee Weapons">
      <characteristicTypes>
        <characteristicType id="914c-b413-91e3-a132" name="Range" defaultValue="Melee"/>
        <characteristicType id="2337-daa1-6682-b110" name="A"/>
        <characteristicType id="95d1-95f-45b4-11d6" name="WS"/>
        <characteristicType id="ab33-d393-96ce-ccba" name="S"/>
        <characteristicType id="41a0-1301-112a-e2f2" name="AP"/>
        <characteristicType id="3254-9fe6-d824-513e" name="D"/>
        <characteristicType id="893f-9000-ccf7-648e" name="Keywords"/>
      </characteristicTypes>
    </profileType>
    <profileType id="74f8-5443-9d6d-1f1e" name="Transport">
      <characteristicTypes>
        <characteristicType id="30f2-be70-861d-1b84" name="Capacity"/>
      </characteristicTypes>
    </profileType>
    <profileType id="4680-63ad-ad70-1872" name="Force Disposition">
      <characteristicTypes>
        <characteristicType id="9145-6e6a-17b9-0a2c" name="Force Disposition"/>
      </characteristicTypes>
    </profileType>
  </profileTypes>
  <categoryEntries>
    <categoryEntry name="Enhancement" id="6226-9b9b-107a-9ada" hidden="true">
      <constraints>
        <constraint type="max" value="4" field="selections" scope="roster" shared="true" id="6b32-8e25-77e5-de28" includeChildSelections="true"/>
      </constraints>
    </categoryEntry>
    <categoryEntry id="9cfd-1c32-585f-7d5c" name="Character" hidden="false"/>
    <categoryEntry id="4f3a-f0f7-6647-348d" name="Epic Hero" hidden="false"/>
    <categoryEntry id="cf47-a0d7-7207-29dc" name="Infantry" hidden="false"/>
    <categoryEntry id="9693-cf84-fe69-37a9" name="Monster" hidden="false"/>
    <categoryEntry id="e338-111e-d0c6-b687" name="Battleline" hidden="false"/>
    <categoryEntry id="ba07-411c-2832-1f79" name="Dedicated Transport" hidden="false"/>
    <categoryEntry id="14a0-40c9-2748-ae6e" name="Mounted" hidden="false"/>
    <categoryEntry id="2d7f-1892-2fd0-e29c" name="Captain" hidden="false"/>
    <categoryEntry id="5a61-81ac-eb7c-a87e" name="Grenades" hidden="false"/>
    <categoryEntry id="286f-80f7-f31d-d070" name="Explosives" hidden="false"/>
    <categoryEntry id="aff3-d6a3-2a95-9dc" name="Imperium" hidden="false"/>
    <categoryEntry id="4ac9-fd30-1e3d-b249" name="Configuration" hidden="false"/>
    <categoryEntry id="1160-70ae-a862-b1a8" name="Unit" hidden="false"/>
    <categoryEntry id="c619-2086-bbcf-69c9" name="Fly" hidden="false"/>
    <categoryEntry id="6df-937-16bc-8c1a" name="Smoke" hidden="false"/>
    <categoryEntry id="13bf-2bee-3ae0-b414" name="Psyker" hidden="false"/>
    <categoryEntry id="dbd4-63-af05-998" name="Vehicle" hidden="false"/>
    <categoryEntry id="6dda-e157-334d-e93a" name="Walker" hidden="false"/>
    <categoryEntry id="75e8-57c4-40e3-1817" name="Transport" hidden="false"/>
    <categoryEntry id="63f1-e6e8-f6f6-a4f0" name="Aircraft" hidden="false"/>
    <categoryEntry id="19d7-9c74-2140-5851" name="Fortification" hidden="false"/>
    <categoryEntry id="d666-e2c9-b6cc-5716" name="Towering" hidden="false"/>
    <categoryEntry id="5929-ad51-d006-e008" name="Titanic" hidden="false"/>
    <categoryEntry id="4c3e-9310-a516-3590" name="Beast" hidden="false"/>
    <categoryEntry id="4c00-2578-faf5-6918" name="Chaos" hidden="false"/>
    <categoryEntry id="bb67-f191-6562-acc7" name="Faction: Chaos Knights" hidden="false"/>
    <categoryEntry id="d1d8-6ae0-1be7-e9e" name="Faction: Tyranids" hidden="false">
      <constraints>
        <constraint type="max" value="-1" field="51b2-306e-1021-d207" scope="force" shared="true" id="10a0-a45c-f379-bb06" includeChildSelections="true" includeChildForces="false"/>
      </constraints>
      <modifiers>
        <modifier type="set" value="500" field="10a0-a45c-f379-bb06" id="d345-5a54-3609-7600">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="3bdf-a114-5035-c6ac" shared="true" includeChildSelections="false"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="d62d-db22-4893-4bc0" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1000" field="10a0-a45c-f379-bb06" id="8a58-5a9f-9d23-5682">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="baf8-997f-e323-a090" shared="true" includeChildSelections="true"/>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="3bdf-a114-5035-c6ac" shared="true" includeChildSelections="false"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1500" field="10a0-a45c-f379-bb06" id="8438-8892-1129-d075">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="4204-82d0-908c-a62a" shared="true" includeChildSelections="true"/>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="3bdf-a114-5035-c6ac" shared="true" includeChildSelections="false"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
      </modifiers>
    </categoryEntry>
    <categoryEntry id="1015-db48-a2fa-c7da" name="Faction: Drukhari" hidden="false">
      <constraints>
        <constraint type="max" value="-1" field="51b2-306e-1021-d207" scope="force" shared="true" id="4d8f-6e09-606e-788e" includeChildSelections="true" includeChildForces="false"/>
      </constraints>
      <modifiers>
        <modifier type="set" value="500" field="4d8f-6e09-606e-788e" id="f5a0-b59-1410-a903">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="38de-521f-1ce0-44a0" shared="true" includeChildSelections="false"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="d62d-db22-4893-4bc0" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1000" field="4d8f-6e09-606e-788e" id="2e33-3f3b-a0f6-a6bd">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="38de-521f-1ce0-44a0" shared="true" includeChildSelections="false"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="baf8-997f-e323-a090" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1500" field="4d8f-6e09-606e-788e" id="2e5f-b5f2-28bb-573e">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="38de-521f-1ce0-44a0" shared="true" includeChildSelections="false"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="4204-82d0-908c-a62a" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
      </modifiers>
    </categoryEntry>
    <categoryEntry id="4378-1827-4988-be4e" name="Faction: Asuryani" hidden="false"/>
    <categoryEntry id="fa45-57e-930e-602b" name="Faction: Astra Militarum" hidden="false"/>
    <categoryEntry id="b5e4-3253-c157-54fd" name="Faction: Imperial Knights" hidden="false">
      <modifiers>
        <modifier type="set" value="1" field="807c-44c1-6f7d-dfb8">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="25dd-7aa0-6bf4-f2d5" shared="true" includeChildForces="false"/>
                <condition type="equalTo" value="0" field="selections" scope="force" childId="4c40-ab9-54af-d290" shared="true"/>
              </conditions>
              <conditionGroups>
                <conditionGroup type="or">
                  <conditions>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="e4d6-1a77-132b-f39d" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="af4c-b971-a31c-669c" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="481c-3b2e-5c99-c248" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="f76f-29c1-de9-74c2" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="1cf9-0660-4ef2-4d18" shared="true" includeChildSelections="true" includeChildForces="true" childName="Bellatus"/>
                  </conditions>
                </conditionGroup>
              </conditionGroups>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="3" field="807c-44c1-6f7d-dfb8">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="25dd-7aa0-6bf4-f2d5" shared="true" includeChildForces="false"/>
                <condition type="atLeast" value="1" field="selections" scope="force" childId="4c40-ab9-54af-d290" shared="true"/>
              </conditions>
              <conditionGroups>
                <conditionGroup type="or">
                  <conditions>
                    <condition type="equalTo" value="0" field="selections" scope="roster" childId="e4d6-1a77-132b-f39d" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="equalTo" value="0" field="selections" scope="roster" childId="af4c-b971-a31c-669c" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="equalTo" value="0" field="selections" scope="roster" childId="f76f-29c1-de9-74c2" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="equalTo" value="0" field="selections" scope="roster" childId="481c-3b2e-5c99-c248" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="equalTo" value="0" field="selections" scope="roster" childId="1cf9-0660-4ef2-4d18" shared="true" includeChildSelections="true" includeChildForces="true" childName="Bellatus"/>
                  </conditions>
                </conditionGroup>
              </conditionGroups>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="0" field="807c-44c1-6f7d-dfb8">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="25dd-7aa0-6bf4-f2d5" shared="true" includeChildForces="false"/>
                <condition type="atLeast" value="1" field="selections" scope="force" childId="4c40-ab9-54af-d290" shared="true"/>
              </conditions>
              <conditionGroups>
                <conditionGroup type="or">
                  <conditions>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="e4d6-1a77-132b-f39d" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="af4c-b971-a31c-669c" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="f76f-29c1-de9-74c2" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="481c-3b2e-5c99-c248" shared="true" includeChildSelections="true" includeChildForces="true"/>
                    <condition type="greaterThan" value="0" field="selections" scope="roster" childId="1cf9-0660-4ef2-4d18" shared="true" includeChildSelections="true" includeChildForces="true" childName="Bellatus"/>
                  </conditions>
                </conditionGroup>
              </conditionGroups>
            </conditionGroup>
          </conditionGroups>
        </modifier>
      </modifiers>
      <constraints>
        <constraint type="max" value="-1" field="selections" scope="force" shared="true" id="807c-44c1-6f7d-dfb8" includeChildSelections="true" includeChildForces="true"/>
      </constraints>
    </categoryEntry>
    <categoryEntry id="1e42-dfae-cbdd-207d" name="Faction: Heretic Astartes" hidden="false">
      <constraints>
        <constraint type="max" value="-1" field="51b2-306e-1021-d207" scope="force" shared="true" id="fbba-7f7e-16a1-370a" includeChildSelections="true"/>
      </constraints>
      <modifiers>
        <modifier type="set" value="500" field="fbba-7f7e-16a1-370a" id="4fa7-457c-8229-7e77">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="c8da-e875-58f7-f6d6" shared="true"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="d62d-db22-4893-4bc0" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1000" field="fbba-7f7e-16a1-370a" id="94e5-8ddd-5373-00cf">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="c8da-e875-58f7-f6d6" shared="true"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="baf8-997f-e323-a090" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1500" field="fbba-7f7e-16a1-370a" id="a7d0-0334-fd3e-416b">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="notInstanceOf" value="1" field="selections" scope="primary-catalogue" childId="c8da-e875-58f7-f6d6" shared="true"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="4204-82d0-908c-a62a" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
      </modifiers>
    </categoryEntry>
    <categoryEntry id="fd71-afa6-b13b-7fda" name="Faction: Adepta Sororitas" hidden="false"/>
    <categoryEntry id="ee0-cf31-4fb5-6b26" name="Faction: Necrons" hidden="false"/>
    <categoryEntry id="571f-ec3a-a5a2-751a" name="Faction: Legiones Daemonica" hidden="false">
      <constraints>
        <constraint type="max" value="-1" field="51b2-306e-1021-d207" scope="force" shared="true" id="f70b-465d-493f-52e3" includeChildSelections="true"/>
      </constraints>
      <modifiers>
        <modifier type="set" value="250" field="f70b-465d-493f-52e3" id="4796-8c50-4a43-66c8">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="c8da-e875-58f7-f6d6" shared="true" childName="Chaos - Chaos Space Marines"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="d62d-db22-4893-4bc0" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="500" field="f70b-465d-493f-52e3" id="bc6-87f4-482b-c1cd">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="c8da-e875-58f7-f6d6" shared="true" childName="Chaos - Chaos Space Marines"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="baf8-997f-e323-a090" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="750" field="f70b-465d-493f-52e3" id="b336-af46-e756-ab15">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="c8da-e875-58f7-f6d6" shared="true" childName="Chaos - Chaos Space Marines"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="4204-82d0-908c-a62a" shared="true" includeChildSelections="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
      </modifiers>
    </categoryEntry>
    <categoryEntry id="b2a9-ede5-7a83-4da8" name="Slaanesh" hidden="false"/>
    <categoryEntry id="ed0d-8e2a-225c-2340" name="Nurgle" hidden="false"/>
    <categoryEntry id="4bd-5ee0-f179-2fc5" name="Khorne" hidden="false"/>
    <categoryEntry id="b188-114f-6ba5-79a1" name="Tzeentch" hidden="false"/>
    <categoryEntry id="6e7-40c-58d9-e402" name="Faction: Adeptus Astartes" hidden="false"/>
    <categoryEntry id="5418-f86b-6e76-c5a" name="Faction: Adeptus Mechanicus" hidden="false">
      <modifiers>
        <modifier type="set" value="250" field="dee8-c245-3c3c-86b6" id="5155-3d32-76df-053b">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="25dd-7aa0-6bf4-f2d5" shared="true" includeChildSelections="true" includeChildForces="true"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="d62d-db22-4893-4bc0" shared="true" includeChildSelections="true" includeChildForces="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="500" field="dee8-c245-3c3c-86b6" id="2f2a-1769-3b72-b003">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="baf8-997f-e323-a090" shared="true" includeChildSelections="true" includeChildForces="true"/>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="25dd-7aa0-6bf4-f2d5" shared="true" includeChildSelections="true" includeChildForces="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="750" field="dee8-c245-3c3c-86b6" id="464a-d2f8-101b-1fab">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="4204-82d0-908c-a62a" shared="true" includeChildSelections="true" includeChildForces="true"/>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="25dd-7aa0-6bf4-f2d5" shared="true" includeChildSelections="true" includeChildForces="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
      </modifiers>
      <constraints>
        <constraint type="max" value="-1" field="51b2-306e-1021-d207" scope="force" shared="true" id="dee8-c245-3c3c-86b6" includeChildSelections="true" includeChildForces="true" negative="false"/>
      </constraints>
    </categoryEntry>
    <categoryEntry id="226b-cf1e-353a-ae7f" name="Faction: Genestealer Cults" hidden="false"/>
    <categoryEntry id="bd1d-c1a5-6ca2-c791" name="Faction: World Eaters" hidden="false"/>
    <categoryEntry id="8474-765-16a9-f00d" name="Faction: Leagues of Votann" hidden="false"/>
    <categoryEntry id="9888-ddb2-a141-6037" name="Faction: Death Guard" hidden="false"/>
    <categoryEntry id="3d58-2655-391e-ecc" name="Faction: T&apos;au Empire" hidden="false"/>
    <categoryEntry id="eea5-aeaf-bbf0-d5ee" name="Faction: Adeptus Custodes" hidden="false"/>
    <categoryEntry id="56cc-5f43-2403-8da0" name="Faction: Orks" hidden="false"/>
    <categoryEntry id="7002-1fbb-7571-e8e7" name="Faction: Thousand Sons" hidden="false"/>
    <categoryEntry id="d564-3284-bf44-b873" name="Faction: Grey Knights" hidden="false"/>
    <categoryEntry id="5128-90b-e4a5-dcbd" name="Faction: Agents of the Imperium" hidden="false"/>
    <categoryEntry id="aab1-4f05-fabe-5ba5" name="Faction: Dark Angels" hidden="false"/>
    <categoryEntry id="65e4-13-4fa8-b36c" name="Faction: Salamanders" hidden="false"/>
    <categoryEntry id="d39c-9989-db7f-d815" name="Faction: Deathwatch" hidden="false"/>
    <categoryEntry id="62ac-ef42-27b4-ae7" name="Faction: Blood Angels" hidden="false"/>
    <categoryEntry id="1a2d-2f00-c054-4dcb" name="Faction: Ultramarines" hidden="false"/>
    <categoryEntry id="a0d9-c115-2a-8330" name="Faction: Space Wolves" hidden="false"/>
    <categoryEntry id="9249-acae-2882-d95" name="Faction: Black Templars" hidden="false"/>
    <categoryEntry id="84b7-7194-3b84-1b0c" name="Faction: Raven Guard" hidden="false"/>
    <categoryEntry id="b88e-1b0c-b79f-5cdf" name="Faction: Iron Hands" hidden="false"/>
    <categoryEntry id="97aa-d0e4-71c7-96c3" name="Faction: Imperial Fists" hidden="false"/>
    <categoryEntry id="5c0e-2250-dd3a-1df9" name="Faction: White Scars" hidden="false"/>
    <categoryEntry id="5c0e-4c31-d51b-e470" name="Warlord" hidden="false">
      <constraints>
        <constraint field="selections" scope="roster" value="1" percentValue="false" shared="true" includeChildSelections="true" includeChildForces="false" id="16ac-a6c9-6d9a-d6d5" type="min"/>
        <constraint field="selections" scope="roster" value="1" percentValue="false" shared="true" includeChildSelections="true" includeChildForces="false" id="3d50-6d29-4f91-8f73" type="max"/>
      </constraints>
    </categoryEntry>
    <categoryEntry id="9c0e-7e25-4580-e439" name="Daemon" hidden="false"/>
    <categoryEntry id="6474-0ce3-6b5a-120c" name="Primarch" hidden="false"/>
    <categoryEntry id="4f09-0141-6c70-6c5a" name="Daemon Prince" hidden="false"/>
    <categoryEntry id="b00b-5bae-444f-964e" name="Swarm" hidden="false"/>
    <categoryEntry id="2471-e2e0-3f55-d6cb" name="Drone" hidden="false"/>
    <categoryEntry id="7850-cc5a-c191-b80d" name="Great Devourer" hidden="false"/>
    <categoryEntry name="Retinue" hidden="false" id="cc77-a53-fca8-f48e"/>
    <categoryEntry name="Terminator" hidden="false" id="740a-892c-8958-defa"/>
    <categoryEntry name="Rhino" hidden="false" id="50a2-5557-84bb-ca4d"/>
    <categoryEntry id="dda2-bb0a-215e-ad9c" name="Jump Pack" hidden="false"/>
    <categoryEntry name="Armiger" id="4c40-ab9-54af-d290" hidden="false"/>
    <categoryEntry name="Questoris" id="e4d6-1a77-132b-f39d"/>
    <categoryEntry name="Dominus" id="af4c-b971-a31c-669c"/>
    <categoryEntry name="Allied Units" hidden="false" id="887b-ab87-92a2-20f5">
      <modifiers>
        <modifier type="set" value="500" field="4d8f-6e09-606e-788e" id="4ff4-f313-206c-fcb0">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="3bdf-a114-5035-c6ac" shared="true" includeChildSelections="true" includeChildForces="true"/>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="d62d-db22-4893-4bc0" shared="true" includeChildSelections="true" includeChildForces="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1000" field="4d8f-6e09-606e-788e" id="934b-e7e4-b560-2d8c">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="baf8-997f-e323-a090" shared="true" includeChildSelections="true" includeChildForces="true"/>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="3bdf-a114-5035-c6ac" shared="true" includeChildSelections="true" includeChildForces="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
        <modifier type="set" value="1500" field="4d8f-6e09-606e-788e" id="d1e5-86a2-d34b-13b3">
          <conditionGroups>
            <conditionGroup type="and">
              <conditions>
                <condition type="greaterThan" value="0" field="selections" scope="force" childId="4204-82d0-908c-a62a" shared="true" includeChildSelections="true" includeChildForces="true"/>
                <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="3bdf-a114-5035-c6ac" shared="true" includeChildSelections="true" includeChildForces="true"/>
              </conditions>
            </conditionGroup>
          </conditionGroups>
        </modifier>
      </modifiers>
      <constraints>
        <constraint type="max" value="-1" field="51b2-306e-1021-d207" scope="roster" shared="true" id="4d8f-6e09-606e-788e" includeChildSelections="true" includeChildForces="true" negative="false"/>
      </constraints>
    </categoryEntry>
    <categoryEntry name="Acastus" hidden="false" id="f76f-29c1-de9-74c2"/>
    <categoryEntry name="Cerastus" hidden="false" id="481c-3b2e-5c99-c248"/>
    <categoryEntry name="Artillery" hidden="false" id="8cab-448d-37b7-32bc"/>
    <categoryEntry name="Faction: Harlequins" id="a5a2-d0c0-0349-d226" hidden="false"/>
    <categoryEntry name="Faction: Ynnari" id="9a21-190a-9d31-35d2" hidden="false"/>
    <categoryEntry name="Psychic Weapon" id="4546-4a0c-b3be-e84c" hidden="true"/>
    <categoryEntry name="Extra Attacks Weapon" id="84c4-6d1e-e724-bd6e" hidden="true"/>
    <categoryEntry name="Torrent Weapon" id="064a-0470-60eb-e3ef" hidden="true"/>
    <categoryEntry name="Ranged Weapon" id="eeda-8544-a2f3-3fab" hidden="true">
      <comment>Used for Enhancement / Crusade Relic upgrades</comment>
    </categoryEntry>
    <categoryEntry name="Melee Weapon" id="ccdd-3987-11ed-90cd" hidden="true">
      <comment>Used for Enhancement / Crusade Relic upgrades</comment>
    </categoryEntry>
    <categoryEntry name="Pistol Weapon" id="1db0-c6b5-19db-8d0c" hidden="true"/>
    <categoryEntry name="Death Company" id="7278-781b-ce6c-d23c" hidden="false"/>
    <categoryEntry name="Attacks Dx Weapon" id="e993-e086-6de1-12af" hidden="true">
      <comment>Weapons that have D3/D6 but no &quot;+x&quot; in their Attacks characteristic - used for logic calculations</comment>
    </categoryEntry>
    <categoryEntry name="Damage Dx Weapon" id="4986-bf86-beb4-13ac" hidden="true">
      <comment>Weapons that have D3/D6 but no &quot;+x&quot; in their Damage characteristic - used for logic calculations</comment>
    </categoryEntry>
    <categoryEntry name="Attacks Dx+0 Modifier" id="6337-b83b-0d1e-5770" hidden="true">
      <comment>Flags a weapon that has had a +0 added to a D3/D6 Attacks characteristic - used for logic calculations</comment>
    </categoryEntry>
    <categoryEntry name="Damage Dx+0 Modifier" id="982b-de77-dd2d-d9bd" hidden="true">
      <comment>Flags a weapon that has had a +0 added to a D3/D6 Damage characteristic - used for logic calculations</comment>
    </categoryEntry>
    <categoryEntry id="59a9-b5cc-7c11-aaad" name="Tech-Priest" hidden="false"/>
    <categoryEntry name="Ministorum Priest" hidden="false" id="cc88-9467-86ac-4ca2">
      <constraints>
        <constraint type="max" value="3" field="selections" scope="roster" shared="true" id="9ad1-8aef-0d46-3b1b" includeChildSelections="true"/>
      </constraints>
    </categoryEntry>
    <categoryEntry name="Sanctifiers" id="9d4f-4beb-107d-3175" hidden="false">
      <constraints>
        <constraint type="max" value="3" field="selections" scope="roster" shared="true" id="3b97-07bb-1241-9cc6" includeChildSelections="true"/>
      </constraints>
    </categoryEntry>
    <categoryEntry name="Pilot" id="5b15-724e-2eeb-8cb7" hidden="false">
      <modifiers>
        <modifier type="set" value="true" field="hidden">
          <conditions>
            <condition type="instanceOf" value="1" field="selections" scope="ancestor" childId="upgrade" shared="true"/>
          </conditions>
        </modifier>
      </modifiers>
    </categoryEntry>
    <categoryEntry name="Assault Weapon" id="e106-0758-7137-2432" hidden="true"/>
    <categoryEntry name="Reference" id="eef1-be80-500a-edfc" hidden="false"/>
    <categoryEntry id="c97c-376-e2e0-1dd2" name="Dreadnought" hidden="false"/>
    <categoryEntry name="Supreme Commander" id="75fe-c657-43c6-7c09" hidden="true"/>
    <categoryEntry name="Bellatus" id="1cf9-0660-4ef2-4d18" hidden="false"/>
    <categoryEntry name="Unbound Adversaries" id="9440-07f1-b09d-ce8b" hidden="false"/>
    <categoryEntry name="Greater Daemon" id="d445-8a18-5300-c3cc" hidden="false"/>
    <categoryEntry name="Lesser Daemon" id="f927-898a-ebe2-1aca" hidden="false"/>
    <categoryEntry name="Abomination" id="e17d-56fd-1957-071f" hidden="false"/>
    <categoryEntry name="Daemonic Beasts" id="a783-fe90-2280-47ec" hidden="false"/>
    <categoryEntry id="e228-a2d3-d863-b438" name="Mobile" hidden="false"/>
  </categoryEntries>
  <forceEntries>
    <forceEntry id="bb9d-299a-ed60-2d8a" name="Army Roster" hidden="false">
      <categoryLinks>
        <categoryLink id="d5de-ee57-ad4b-e4b7" name="Configuration" hidden="false" targetId="4ac9-fd30-1e3d-b249" primary="false"/>
        <categoryLink id="16fc-8e39-ee82-cf96" name="Epic Hero" hidden="false" targetId="4f3a-f0f7-6647-348d" primary="false"/>
        <categoryLink id="c932-1176-dc9-b390" name="Character" hidden="false" targetId="9cfd-1c32-585f-7d5c" primary="false">
          <constraints>
            <constraint field="selections" scope="roster" value="1" percentValue="false" shared="true" includeChildSelections="true" includeChildForces="true" id="f08b-2179-601f-9af" type="min"/>
          </constraints>
          <modifiers>
            <modifier type="set" value="0" field="f08b-2179-601f-9af">
              <conditionGroups>
                <conditionGroup type="or">
                  <conditions>
                    <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="bdc0-c0d-72d7-87e2" shared="true" id="1fe4-8f37-4c24-271"/>
                    <condition type="instanceOf" value="1" field="selections" scope="primary-catalogue" childId="880c-c7e-4a43-a0c1" shared="true" id="f16a-b2cd-1da5-4050"/>
                  </conditions>
                </conditionGroup>
              </conditionGroups>
            </modifier>
          </modifiers>
        </categoryLink>
        <categoryLink id="b3ba-1e1a-a92d-60d2" name="Battleline" hidden="false" targetId="e338-111e-d0c6-b687" primary="false"/>
        <categoryLink id="6d77-b79d-3ccb-6bf6" name="Infantry" hidden="false" targetId="cf47-a0d7-7207-29dc" primary="false"/>
        <categoryLink id="f5d5-b603-69b3-411c" name="Swarm" hidden="false" targetId="b00b-5bae-444f-964e" primary="false"/>
        <categoryLink id="6503-057c-cb62-badb" name="Mounted" hidden="false" targetId="14a0-40c9-2748-ae6e" primary="false"/>
        <categoryLink id="87ea-37d2-7b40-c708" name="Beast" hidden="false" targetId="4c3e-9310-a516-3590" primary="false"/>
        <categoryLink id="8e39-465e-7cfc-3085" name="Monster" hidden="false" targetId="9693-cf84-fe69-37a9" primary="false"/>
        <categoryLink id="2c76-65c5-bad0-8208" name="Vehicle" hidden="false" targetId="dbd4-63-af05-998" primary="false"/>
        <categoryLink id="8243-857b-2133-8887" name="Drone" hidden="false" targetId="2471-e2e0-3f55-d6cb" primary="false"/>
        <categoryLink id="cf3e-2c24-fe34-39f9" name="Dedicated Transport" hidden="false" targetId="ba07-411c-2832-1f79" primary="false"/>
        <categoryLink id="9198-c35d-71cd-eea3" name="Fortification" hidden="false" targetId="19d7-9c74-2140-5851" primary="false"/>
        <categoryLink id="a41a-6330-4718-d8d2" name="Unit" hidden="false" targetId="1160-70ae-a862-b1a8" primary="false"/>
        <categoryLink name="Allied Units" hidden="false" id="8d39-1cfc-6e44-2dae" targetId="887b-ab87-92a2-20f5"/>
        <categoryLink name="Reference" hidden="false" id="3761-5a4e-79e0-3c18" targetId="eef1-be80-500a-edfc"/>
      </categoryLinks>
      <modifiers>
        <modifier type="set" field="readme"/>
      </modifiers>
    </forceEntry>
  </forceEntries>
  <entryLinks>
    <entryLink id="7380-3e40-6ed6-b7cc" name="Battle Size" hidden="false" collective="false" import="true" targetId="564e-fbc6-5266-3ea4" type="selectionEntry"/>
  </entryLinks>
  <sharedSelectionEntries>
    <selectionEntry id="564e-fbc6-5266-3ea4" name="Battle Size" hidden="false" collective="false" import="true" type="upgrade">
      <constraints>
        <constraint field="selections" scope="roster" value="1" percentValue="false" shared="true" includeChildSelections="true" includeChildForces="true" id="d907-5a90-75f2-feec" type="max"/>
        <constraint field="selections" scope="roster" value="1" percentValue="false" shared="true" includeChildSelections="true" includeChildForces="true" id="6b1c-4cb6-1e16-5ada" type="min"/>
      </constraints>
      <categoryLinks>
        <categoryLink id="bc21-bf76-b29d-576c" name="Configuration" hidden="false" targetId="4ac9-fd30-1e3d-b249" primary="true"/>
      </categoryLinks>
      <selectionEntryGroups>
        <selectionEntryGroup id="b960-4789-a3a6-59cb" name="Battle Size" hidden="false" collective="false" import="true" defaultSelectionEntryId="none">
          <constraints>
            <constraint field="selections" scope="parent" value="1" percentValue="false" shared="true" includeChildSelections="false" includeChildForces="false" id="132a-318-b78a-7afb" type="min"/>
            <constraint field="selections" scope="parent" value="1" percentValue="false" shared="true" includeChildSelections="false" includeChildForces="false" id="dea4-90c8-6d86-3a01" type="max"/>
          </constraints>
          <selectionEntries>
            <selectionEntry id="d62d-db22-4893-4bc0" name="1. Incursion (1000 Point limit)" hidden="false" collective="false" import="true" type="upgrade">
              <costs>
                <cost name="pts" typeId="51b2-306e-1021-d207" value="0"/>
              </costs>
            </selectionEntry>
            <selectionEntry id="baf8-997f-e323-a090" name="2. Strike Force (2000 Point limit)" hidden="false" collective="false" import="true" type="upgrade">
              <costs>
                <cost name="pts" typeId="51b2-306e-1021-d207" value="0"/>
              </costs>
            </selectionEntry>
            <selectionEntry id="4204-82d0-908c-a62a" name="3. Onslaught (3000 Point limit)" hidden="false" collective="false" import="true" type="upgrade">
              <costs>
                <cost name="pts" typeId="51b2-306e-1021-d207" value="0"/>
              </costs>
            </selectionEntry>
          </selectionEntries>
        </selectionEntryGroup>
      </selectionEntryGroups>
      <costs>
        <cost name="pts" typeId="51b2-306e-1021-d207" value="0"/>
      </costs>
    </selectionEntry>
    <selectionEntry type="upgrade" import="true" name="Show/Hide Options" hidden="false" id="e8ef-836a-a9d1-901d">
      <constraints>
        <constraint field="selections" scope="force" value="1" percentValue="false" shared="true" includeChildSelections="false" includeChildForces="false" id="7478-2e95-2444-b500" type="min"/>
      </constraints>
      <modifiers>
        <modifier type="set" field="7478-2e95-2444-b500" value="0"/>
        <modifier type="set-primary" value="4ac9-fd30-1e3d-b249" field="category"/>
      </modifiers>
      <selectionEntryGroups></selectionEntryGroups>
    </selectionEntry>
  </sharedSelectionEntries>
  <sharedRules>
    <rule id="8bf7-8812-923d-29e4" name="Pistol" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>Pistols can be wielded even at point-blank range.
**[PISTOL]** and **[CLOSE-QUARTERS]** are identical for all rules purposes. See **[CLOSE-QUARTERS]**.
Designer&apos;s Note: **[PISTOL]** is a pre-existing ability that will be superseded by **[CLOSE-QUARTERS]** as this edition of Warhammer 40,000 progresses. Both are functionally the same, but the latter is a more suitable term for weapons that function in this way.</description>
      <alias>PISTOL</alias>
    </rule>
    <rule id="8367-374c-f87-c627" name="Hazardous" publicationId="48fc-15aa-b307-9443" page="28" hidden="false">
      <description>Weapons powered by unstable and dangerous energy sources pose a substantial risk to the wielder and those that stand beside them.
Each time a unit is selected to shoot or selected to fight, after that unit has resolved all of its attacks, make a number of hazard rolls (06.03) for that unit equal to the number of **[HAZARDOUS]** weapons you selected in the Select Weapons step.</description>
      <alias>HAZARDOUS</alias>
    </rule>
    <rule id="b4dd-3e1f-41cb-218f" name="Leader" publicationId="48fc-15aa-b307-9443" page="39" hidden="false">
      <description>Mighty heroes fight at the forefront of battle.
See Attached Units (19).</description>
    </rule>
    <rule id="be1e-ac8e-1e2c-3528" name="Devastating Wounds" publicationId="48fc-15aa-b307-9443" page="28" hidden="false">
      <description>The most potent weapons strike with such power that they make a mockery of armour and can cleave through several foes.
Each time an attack made with a **[DEVASTATING WOUNDS]** weapon results in a critical wound, the attack sequence for that attack ends and the target unit suffers a number of mortal wounds equal to the D characteristic of that weapon. These are inflicted after resolving any normal damage inflicted by those attacks.
Mortal wounds inflicted by **[DEVASTATING WOUNDS]** weapons can damage a maximum of one model for each critical wound; any remaining mortal wounds inflicted by that attack are lost.
Example: An attack made with a **[DEVASTATING WOUNDS]** weapon with a D characteristic of 3 results in a critical wound against an Intercessor Squad, so inflicts 3 mortal wounds. The first 2 mortal wounds are sufficient to destroy 1 Intercessor model, so the remaining mortal wound is lost.</description>
      <alias>DEVASTATING WOUNDS</alias>
    </rule>
    <rule id="fc8a-8c24-bae9-cc1c" name="Assault" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>Folding stocks, shortened barrels or lightweight construction enable some weapons to be easily fired on the move.
Units containing one or more models with an **[ASSAULT]** weapon can shoot using assault shooting (10.05).</description>
      <alias>ASSAULT</alias>
    </rule>
    <rule id="115b-79dc-f723-d761" name="Extra Attacks" publicationId="48fc-15aa-b307-9443" page="28" hidden="false">
      <description>Some warriors ride to battle atop trusty mounts that gore and trample nearby foes. Others wield combat weapons that deliver a frenzy of additional blows.
Each time a unit containing one or more models with an **[EXTRA ATTACKS]** weapon fights, those models will make attacks with those weapons in addition to any others. In the Select Weapons step (04.01), for each of those models, you must select:
■ All of that model&apos;s **[EXTRA ATTACKS]** weapons.
■ One of that model&apos;s other melee weapons, if possible.</description>
      <alias>EXTRA ATTACKS</alias>
    </rule>
    <rule id="cf93-ad4d-2f08-a79d" name="Twin-linked" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>Dual weapons are often grafted to the same targeting system for greater lethality.
Each time an attack is made with a **[TWIN-LINKED]** weapon, you can re-roll the wound roll.</description>
      <alias>TWIN-LINKED</alias>
    </rule>
    <rule id="4111-82e3-9444-e942" name="Anti-" publicationId="48fc-15aa-b307-9443" page="28" hidden="false">
      <description>Certain weapons are the bane of particular foes.
This ability always takes the form **[ANTI-X Y+]**. Each time an attack is made with an **[ANTI]** weapon, if the target unit has the keyword denoted by X, an unmodified wound roll of Y+ is a critical wound.
Example: An attack made with an **[ANTI-VEHICLE 4+]** weapon against a **^^Vehicle^^** unit will result in a critical wound on an unmodified wound roll of 4+, while an attack made with an **[ANTI-PSYKER 2+]** weapon against a **^^Psyker^^** unit will result in a critical wound on an unmodified wound roll of 2+.</description>
      <alias>ANTI-</alias>
    </rule>
    <rule id="1897-c22c-9597-12b1" name="Sustained Hits" publicationId="48fc-15aa-b307-9443" page="28" hidden="false">
      <description>Some weapons possess a punishing rate of fire, or can land devastating flurries of blows, tearing the foe apart with relentless ferocity.
This ability always takes the form **[SUSTAINED HITS X]**. Each time an attack made with a **[SUSTAINED HITS]** weapon results in a critical hit, that attack results in a number of additional hits on the target as denoted by X.
Example: An attack made with a **[SUSTAINED HITS 2]** weapon results in a critical hit. That attack therefore hits the target three times (once from the critical hit, and twice more from the **[SUSTAINED HITS 2]** ability).</description>
      <alias>SUSTAINED HITS</alias>
    </rule>
    <rule id="1202-10a8-78e9-4c67" name="Heavy" publicationId="48fc-15aa-b307-9443" page="26" hidden="false">
      <description>Heavy weapons are amongst the biggest guns on the battlefield, but require bracing to fire at full effect.
In your Shooting phase, each time an attack is made with a **[HEAVY]** weapon, add 1 to the hit roll if all of the following apply to the attacking unit:
■ That unit is unengaged.
■ That unit was not set up on the battlefield this turn.
■ No model in that unit has moved more than 3&quot; this turn.</description>
      <alias>HEAVY</alias>
    </rule>
    <rule id="7cdb-fb99-44a9-8849" name="Melta" publicationId="48fc-15aa-b307-9443" page="26" hidden="false">
      <description>Melta weapons are powerful heat rays whose fury is magnified at close range.
This ability always takes the form **[MELTA X]**. Each time a model makes an attack with a **[MELTA]** weapon, if the target unit was within half range of that weapon in the Select Targets step, until the attacking unit&apos;s attacks have been resolved, add X to that weapon&apos;s D characteristic.
Example: A model targets a unit that is within half range of a **[MELTA 2]** weapon with a D characteristic of D6. While resolving those attacks, that weapon has a D characteristic of D6+2.</description>
      <alias>MELTA</alias>
    </rule>
    <rule id="9bf4-280f-bbe2-6fbb" name="Feel No Pain" publicationId="48fc-15aa-b307-9443" page="23" hidden="false">
      <description>The hardiest warriors refuse to be laid low, even by wounds that should by all rights prove lethal.
This ability always takes the form Feel No Pain X+. Each time a model with this ability would lose a wound, roll one D6: on an X+, that wound is not lost.</description>
    </rule>
    <rule id="6c1f-1cf7-ff25-c99e" name="Blast" publicationId="48fc-15aa-b307-9443" page="26" hidden="false">
      <description>High-explosive rounds can fell several warriors in a single blast, but firing them too close to comrades is unwise.
Each time you gather attack dice for a **[BLAST]** weapon, add one additional attack dice for every five models that were in the target unit in the Select Targets step (rounding down).
If this ability takes the form **[BLAST X]**, each time you gather attack dice for such a weapon, add X additional attack dice for every five models that were in the target unit in the Select Targets step (rounding down) instead.
Example: If a **[BLAST 2]** weapon with an A characteristic of 3 targets a unit containing 12 models, you would gather four additional attack dice for that weapon (for a total of seven for that weapon).</description>
      <alias>BLAST</alias>
    </rule>
    <rule id="9143-31ae-e0a6-6007" name="Precision" publicationId="48fc-15aa-b307-9443" page="26" hidden="false">
      <description>Precision attacks can pick high-value targets out in a crowd.
While resolving attacks made with one or more **[PRECISION]** weapons, at the start of the Allocation Order step (05.03), if the target unit contains one or more **^^Character^^** models visible to one or more of the attacking models, the active player can select one allocation group that contains one of those visible **^^Character^^** models. If they do, until those attacks are resolved, or until that **^^Character^^** group is destroyed (whichever happens first), that **^^Character^^** group is the current allocation group.</description>
      <alias>PRECISION</alias>
    </rule>
    <rule id="4ddd-4e29-acdd-5e6d" name="Indirect Fire" publicationId="48fc-15aa-b307-9443" page="26" hidden="false">
      <description>Indirect fire weapons launch munitions over or around intervening obstacles – nowhere is safe from their fury.
Units containing one or more models with an **[INDIRECT FIRE]** weapon can shoot using indirect shooting (10.07).</description>
      <alias>INDIRECT FIRE</alias>
    </rule>
    <rule id="2ebc-abdf-8129-6c57" name="Lance" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>With the momentum of a warrior at full-tilt, lance weapons are deadly on the charge.
Each time an attack is made with a **[LANCE]** weapon, if the attacking model&apos;s unit made a charge move this turn, add 1 to the wound roll.</description>
      <alias>LANCE</alias>
    </rule>
    <rule id="d1d1-611e-5191-1095" name="Lethal Hits" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>Many deadly weapons can inflict fatal injuries on any foe, no matter their resilience.
Each time an attack made with a **[LETHAL HITS]** weapon results in a critical hit, you can choose for that attack to automatically wound the target.
Designer&apos;s Note: Choosing to automatically wound the target means that no wound roll is made for that attack. You may decide against this, as it means that attack cannot result in a critical wound and so cannot trigger other abilities such as **[DEVASTATING WOUNDS]**.</description>
      <alias>LETHAL HITS</alias>
    </rule>
    <rule id="4640-43e7-30b-215a" name="Ignores Cover" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>Some weapons are designed to root enemy formations out of entrenched positions.
Each time an attack is made with an **[IGNORES COVER]** weapon, the target cannot have the benefit of cover against that attack (13.08), including from rules that give a model or unit the benefit of cover (e.g. Stealth).</description>
      <alias>IGNORES COVER</alias>
    </rule>
    <rule id="c5c8-8b58-b8b6-7786" name="Rapid Fire" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>Rapid fire weapons are capable of long-ranged precision shots or controlled bursts at nearby targets.
This ability always takes the form **[RAPID FIRE X]**. Each time you gather attack dice for a **[RAPID FIRE]** weapon, add X additional attack dice if the target unit was within half range of that weapon in the Select Targets step.
Example: If a **[RAPID FIRE 1]** weapon with an A characteristic of 1 targets a unit that is within half range, you would gather one additional attack dice for that weapon (for a total of two for that weapon).</description>
      <alias>RAPID FIRE</alias>
    </rule>
    <rule id="5edf-d619-23e0-9b56" name="Torrent" publicationId="48fc-15aa-b307-9443" page="25" hidden="false">
      <description>Torrent weapons project clouds of fire, gas or other lethal substances that few foes can hope to evade.
Each time an attack is made with a **[TORRENT]** weapon, that attack automatically hits the target.</description>
      <alias>TORRENT</alias>
    </rule>
    <rule id="ada6-bac1-ffe0-d6f7" name="Scouts" publicationId="48fc-15aa-b307-9443" page="39" hidden="false">
      <description>Scouts form the vanguard of many armies. Unnoticed by the enemy, they range ahead of the main force.
This ability always takes the form Scouts X&quot;. In the Resolve Pre-battle Abilities step, if every model in a unit has this ability, you can do one of the following:
■ If that unit is in strategic reserves, you can set up that unit anywhere that is wholly within your deployment zone.
■ If that unit is wholly within your deployment zone, it can make a scout move (see below).
■ If that unit is embarked within a **^^Dedicated Transport^^** that is wholly within your deployment zone, and if every model embarked within that **^^Dedicated Transport^^** has the Scouts ability, that **^^Dedicated Transport^^** can make a scout move.
Scout Move — Maximum distance: the X&quot; in Scouts X&quot;. Eligible if: it is the Resolve Pre-battle Abilities step, and your unit is wholly within your deployment zone. Effect: your unit moves as described in Moving (03). After moving: your unit must be more than 8&quot; horizontally from all enemy units.</description>
    </rule>
    <rule id="c05d-f4c3-f091-4938" name="Infiltrators" publicationId="48fc-15aa-b307-9443" page="39" hidden="false">
      <description>Many armies employ reconnaissance units who can sit concealed, waiting for the right moment to strike.
During deployment, if every model in a unit has this ability, it can be set up anywhere on the battlefield that is more than 8&quot; horizontally from your opponent&apos;s deployment zone and all enemy units.</description>
    </rule>
    <rule id="7cb5-dd6b-dd87-ad3b" name="Deep Strike" publicationId="48fc-15aa-b307-9443" page="39" hidden="false">
      <description>There are many ways by which to deploy troops to the field of battle including tunnels, teleportation devices and other esoteric means of transportation.
Each time this unit makes an ingress move (20.04), if every model in this unit has this ability, it can be set up anywhere on the battlefield that is more than 8&quot; horizontally from all enemy units, even if that is within your opponent&apos;s deployment zone.</description>
    </rule>
    <rule id="b68a-5ded-65ac-98c" name="Deadly Demise" publicationId="48fc-15aa-b307-9443" page="23" hidden="false">
      <description>From detonating ammo stores to corrosive innards or frenzied death throes, some targets are deadly even in defeat.
This ability always takes the form Deadly Demise X. Each time a model in this unit is destroyed, after the units embarked within it (if any) have made their emergency disembark moves, roll one D6. On a 6, that model suffers a deadly demise; each unit within 6&quot; of that model suffers a number of mortal wounds denoted by X (if this is a random number, roll separately for each unit within 6&quot;).
Example: An Impulsor with a unit of Intercessors embarked within it is destroyed by ranged attacks. First, any unresolved attacks made by the attacking unit are resolved. Then the Intercessors make an emergency disembark move. Then the roll is made for the Deadly Demise ability, and on a 6, that ability is resolved. Finally, the Impulsor is removed from the battlefield.</description>
    </rule>
    <rule id="bec5-4288-34a6-ccfa" name="Stealth" publicationId="48fc-15aa-b307-9443" page="20" hidden="false">
      <comment>def-mod: source=&quot;Stealth&quot; cover when=ranged conditional</comment>
      <description>The stealthiest warriors can evade the attentions, and the bullets, of their foes.
If every model in a unit has this ability, each time a ranged attack targets that unit, that unit has the benefit of cover against that attack (13.08).</description>
    </rule>
    <rule id="5e13-1624-d280-418d" name="Super-Heavy Walker" hidden="false">
      <description>Monstrous creatures and gigantic engines of war loom over the battlefield like gods given form, striding over combatants and smashing through almost any obstacle that bars their passage.
Each time a unit with this ability makes a normal, advance or fall-back move:
■ Models in that unit can move through models (including **^^Monster^^**/**^^Vehicle^^** models, but excluding **^^Titanic^^** models) and can move horizontally through sections of terrain features that are 4&quot; or less in height.
■ Before moving that unit, you can select for all models in that unit to have the **^^Mobile^^** keyword until that move ends. If you do, when that move ends, roll one D6: on a 1, that unit is battle-shocked.
Designer&apos;s Note: Gaining the **^^Mobile^^** keyword for the duration of a move will enable models in that unit to move horizontally through dense terrain features (13.06).</description>
    </rule>
    <rule id="a8a0-8fe7-898-e0f3" name="Lone Operative" publicationId="48fc-15aa-b307-9443" page="19" hidden="false">
      <description>Assassins and other covert agents are difficult to pinpoint in the storm of battle.
Unless part of an attached unit, this unit is not visible to enemy models unless they are within 12&quot; of this unit, and it cannot be targeted by **[INDIRECT FIRE]** weapons unless the attacking model is within 12&quot; of this unit.
If this ability takes the form Lone Operative X&quot;, unless part of an attached unit, this unit is not visible to enemy models unless they are within X&quot; of this unit, and it cannot be targeted by **[INDIRECT FIRE]** weapons unless the attacking model is within X&quot; of this unit.</description>
    </rule>
    <rule id="eec5-5f54-9c03-c305" name="Hover" publicationId="48fc-15aa-b307-9443" page="53" hidden="false">
      <description>Some airborne vehicles can use vectored thrusters or anti-gravity technology to hover and skim over the battlefield, the better to hunt their prey or deploy embarked troops.
Each time this unit takes to the skies (21.03), do not subtract 2&quot; from the maximum distance.</description>
    </rule>
    <rule id="24-c886-e8ba-5a89" name="Fights First" publicationId="48fc-15aa-b307-9443" page="32" hidden="false">
      <description>Those possessed of lightning-fast reactions may strike before the opponent can react.
While every model in a unit has this ability, that unit is a Fights First unit. See the Resolve Fights First Combats step in the Fight phase (12.04).</description>
    </rule>
    <rule id="e9c4-2bb8-12ee-cd1b" name="Psychic" publicationId="48fc-15aa-b307-9443" page="38" hidden="false">
      <description>Some weapons can channel the bearer&apos;s psychic might to empower their blows.
Each time an attack is made with a **[PSYCHIC]** weapon, you can ignore any or all modifiers to that attack&apos;s BS or WS characteristic and any or all modifiers to the hit roll. Attacks made with **[PSYCHIC]** weapons are known as psychic attacks (this can be important for the triggering of other rules).</description>
      <alias>PSYCHIC</alias>
    </rule>
    <rule id="13b2-6518-dab3-7ea1" name="Firing Deck" page="17" hidden="false">
      <description>Some transports have dedicated platforms or firing ports from which embarked passengers can lay down a withering hail of munitions.
This ability always takes the form Firing Deck X. In your Shooting phase, each time this **^^Transport^^** is selected to shoot, if one or more units are embarked within it, resolve the following sequence:
■ Select up to X models embarked within this **^^Transport^^** (excluding models whose units have already been selected to shoot this phase).
■ For each selected model, select one of its ranged weapons (excluding **[ONE SHOT]** weapons).
■ Until this **^^Transport^^** has resolved all of its attacks, it has all of those selected weapons in addition to its other weapons.
■ Until the end of the turn, units embarked within this **^^Transport^^** are not eligible to shoot.</description>
    </rule>
    <rule id="cd26-1611-860a-91e4" name="One Shot" hidden="false">
      <description>Some weapons are so rare, or so complex and slow to reload, that they can only be used once.
Each weapon with this ability can only be selected to make attacks with once per battle.
If a destroyed model is returned to a unit, all of its **[ONE SHOT]** weapons that have already been selected to make attacks with during the battle cannot be selected to make attacks with again.
If a new unit is added to an army, all **[ONE SHOT]** weapons in that unit can be selected to make attacks with once per battle.</description>
      <alias>ONE SHOT</alias>
    </rule>
    <rule id="ea1f-c7b7-cafa-43f8" name="Cleave" publicationId="48fc-15aa-b307-9443" page="79" hidden="false">
      <description>With sufficient might or skill, warriors may sweep blades or talons through their foes in long lethal arcs.
This ability always takes the form **[CLEAVE X]**. Each time you gather attack dice for a **[CLEAVE]** weapon, if you only selected one target for all of that weapon&apos;s attacks, add X additional attack dice for every five models that were in the target unit in the Select Targets step (rounding down).
Example: If a **[CLEAVE 1]** weapon with an A characteristic of 3 targets one unit containing 16 models, you would gather three additional attack dice for that weapon (for a total of six for that weapon).</description>
      <alias>CLEAVE</alias>
    </rule>
    <rule id="59e0-775e-fce5-43ca" name="Close-Quarters" publicationId="48fc-15aa-b307-9443" page="80" hidden="false">
      <description>Weapons designed for close-quarters fighting can be wielded effectively even in the press of melee combat.
Units containing one or more models with a **[CLOSE-QUARTERS]** weapon can shoot using close-quarters shooting (10.06).
When using another shooting type, for each model in that unit (excluding **^^Monster^^**/**^^Vehicle^^** models), you can only select one of the following to make attacks with:
■ One or more of its **[CLOSE-QUARTERS]** weapons.
■ One or more of its other ranged weapons.</description>
      <alias>CLOSE-QUARTERS</alias>
    </rule>
    <rule id="21f5-c07c-6d97-4405" name="Support" publicationId="48fc-15aa-b307-9443" page="84" hidden="false">
      <description>Specialist combatants may be assigned to front-line squads to bolster their fighting effectiveness.
See Attached Units (19).</description>
      <alias>SUPPORT</alias>
    </rule>
    <rule id="d4d5-4375-0e91-c7d0" name="Stratagem: Command Re-roll (1CP)" publicationId="48fc-15aa-b307-9443" page="55" hidden="false">
      <comment>strat-timing: turn=either phase=any</comment>
      <description>**CORE STRATAGEM — 1CP** (15.02)

**WHEN:** Any phase, just after you make an Advance, Charge, Damage, Hazard, Hit, Save or Wound roll, or a roll to determine the number of attacks generated with a weapon, for a friendly unit or model.
**TARGET:** That unit or model.
**EFFECT:** You re-roll that roll. If you are rolling more than one dice together, select one of those dice to re-roll (excluding charge rolls, which you must re-roll in full).</description>
    </rule>
    <rule id="c205-a458-8cdb-5eac" name="Stratagem: Epic Challenge (1CP)" publicationId="48fc-15aa-b307-9443" page="55" hidden="false">
      <comment>strat-timing: turn=either phase=fight</comment>
      <description>**CORE STRATAGEM — 1CP** (15.03)

**WHEN:** Fight phase, just after a friendly CHARACTER unit is selected to fight.
**TARGET:** That CHARACTER unit.
**EFFECT:** Select one CHARACTER model in your unit. Until the end of the phase, that model’s melee weapons have the [PRECISION] ability.</description>
    </rule>
    <rule id="fcbf-0c41-f037-5094" name="Stratagem: Insane Bravery (1CP)" publicationId="48fc-15aa-b307-9443" page="55" hidden="false">
      <comment>strat-timing: turn=your phase=command</comment>
      <description>**CORE STRATAGEM — 1CP** (15.04)

**WHEN:** Battle-shock step of your Command phase, just before you make a battle-shock roll for a friendly unit.
**TARGET:** That unit.
**EFFECT:** That battle-shock roll is automatically successful.
**RESTRICTIONS:** You cannot use this stratagem more than once per battle.</description>
    </rule>
    <rule id="4fc8-f3ee-3d63-0dcf" name="Stratagem: Explosives (1CP)" publicationId="48fc-15aa-b307-9443" page="55" hidden="false">
      <comment>strat-timing: turn=your phase=shooting</comment>
      <description>**CORE STRATAGEM — 1CP** (15.05)

**WHEN:** Your Shooting phase.
**TARGET:** One friendly unengaged EXPLOSIVES/GRENADES unit that is eligible to shoot and did not make an Advance move this turn.
**EFFECT:** Resolve the following sequence:
1. Select one EXPLOSIVES/GRENADES model in your unit.
2. Select one unengaged enemy unit within 8" of and visible to that model.
3. Roll six D6: for each 4+, that enemy unit suffers 1 mortal wound.</description>
    </rule>
    <rule id="40e8-48bd-5c13-ac7d" name="Stratagem: Crushing Impact (1CP)" publicationId="48fc-15aa-b307-9443" page="55" hidden="false">
      <comment>strat-timing: turn=your phase=charge</comment>
      <description>**CORE STRATAGEM — 1CP** (15.06)

**WHEN:** Your Charge phase, just after a friendly MONSTER/VEHICLE unit ends a charge move.
**TARGET:** That MONSTER/VEHICLE unit.
**EFFECT:** Select one enemy unit engaged with your unit, then one model in your unit engaged with that enemy unit. Roll a number of D6 equal to that model’s Toughness: for each 1, your unit suffers 1 mortal wound; for each 5+, that enemy unit suffers 1 mortal wound (to a maximum of 6 mortal wounds per unit).</description>
    </rule>
    <rule id="3e0f-57c7-79b7-77a8" name="Stratagem: Rapid Ingress (1CP)" publicationId="48fc-15aa-b307-9443" page="56" hidden="false">
      <comment>strat-timing: turn=opponent phase=movement</comment>
      <description>**CORE STRATAGEM — 1CP** (15.07)

**WHEN:** End of your opponent’s Movement phase.
**TARGET:** One friendly unit that is in strategic reserves (excluding AIRCRAFT).
**EFFECT:** Your unit makes an ingress move (20.04).
**RESTRICTIONS:** You cannot use this stratagem during the first battle round.</description>
    </rule>
    <rule id="e421-1f40-8c6e-ac44" name="Stratagem: Fire Overwatch (1CP)" publicationId="48fc-15aa-b307-9443" page="56" hidden="false">
      <comment>strat-timing: turn=opponent phase=movement</comment>
      <description>**CORE STRATAGEM — 1CP** (15.08)

**WHEN:** End of your opponent’s Movement phase.
**TARGET:** One friendly unengaged unit (excluding TITANIC units).
**EFFECT:** Your unit shoots using snap shooting (15.09): you can only target one visible enemy unit within 24"; each attack only hits on an unmodified Hit roll of 6 (irrespective of BS or modifiers); you cannot re-roll Hit rolls.</description>
    </rule>
    <rule id="0212-a34f-5622-ac26" name="Stratagem: Smokescreen (1CP)" publicationId="48fc-15aa-b307-9443" page="56" hidden="false">
      <comment>strat-timing: turn=opponent phase=shooting
def-mod: source=&quot;Stratagem: Smokescreen (1CP)&quot; cover conditional</comment>
      <description>**CORE STRATAGEM — 1CP** (15.10)

**WHEN:** Start of your opponent’s Shooting phase.
**TARGET:** One friendly SMOKE unit.
**EFFECT:** Until the end of the phase, each time an attack targets your SMOKE unit (or a unit that is not fully visible to the attacking model because of one or more models in your SMOKE unit), the target has the benefit of cover against that attack.</description>
    </rule>
    <rule id="b60b-c9ff-cea8-a442" name="Stratagem: Heroic Intervention (1CP/2CP)" publicationId="48fc-15aa-b307-9443" page="57" hidden="false">
      <comment>strat-timing: turn=opponent phase=charge</comment>
      <description>**CORE STRATAGEM — 1CP (or 2CP)** (15.11)

**WHEN:** End of your opponent’s Charge phase.
**TARGET:** One friendly unengaged unit within 12" of one or more enemy units. You can only select a VEHICLE unit if it is a CHARACTER/WALKER unit.
**EFFECT:** Resolve a charge with your unit (11.02). Before making the charge roll, select one of:
- **Leap to Defend:** When selecting charge targets, you can only select enemy units that made a charge move this phase and are within the maximum distance.
- **Into the Fray (+1CP):** When making the charge roll, if the result is greater than 6 (after modifiers), change it to 6. When selecting charge targets, you can select any enemy units within 6" of your unit and within the maximum distance.</description>
    </rule>
    <rule id="9d34-55e4-b050-f842" name="Stratagem: Counter-offensive (2CP)" publicationId="48fc-15aa-b307-9443" page="57" hidden="false">
      <comment>strat-timing: turn=opponent phase=fight</comment>
      <description>**CORE STRATAGEM — 2CP** (15.12)

**WHEN:** Fight step of your opponent’s Fight phase, just after an enemy unit has resolved its attacks.
**TARGET:** One friendly unit that is eligible to fight.
**EFFECT:** Until the end of the phase, your unit has the Fights First ability and it must be the next unit you select to fight (12.04).</description>
    </rule>
    <rule id="8931-e19c-2851-f4da" name="Core Rule: The Battle Round (07)" publicationId="48fc-15aa-b307-9443" page="28" hidden="false">
      <description>A battle lasts five battle rounds. In each battle round both players take a turn, starting with the player who has the first turn. During its turn, a player progresses through five phases in this order:
1. **Command phase** (08)
2. **Movement phase** (09)
3. **Shooting phase** (10)
4. **Charge phase** (11)
5. **Fight phase** (12)
When a player has completed all five phases, their turn ends.</description>
    </rule>
    <rule id="8360-5587-5507-9033" name="Core Rule: Command Phase (08)" publicationId="48fc-15aa-b307-9443" page="30" hidden="false">
      <description>The Command phase has two steps:
- **Command step:** You gain 1 Command Point (CP).
- **Battle-shock step:** Take a Battle-shock test (roll 2D6 vs Leadership) for each of your units that is below its Starting Strength. A battle-shocked unit has OC 0, fails Desperate Escape tests more easily, and cannot use stratagems on it/control objectives normally until the start of your next Command phase.</description>
    </rule>
    <rule id="f60b-8e32-2b3b-33f8" name="Core Rule: Remain Stationary (09.04)" publicationId="48fc-15aa-b307-9443" page="32" hidden="false">
      <description>**MAXIMUM DISTANCE:** ‘–’.
**ELIGIBLE IF:** Any unit.
**EFFECT:** No models are moved (neither in straight lines nor rotated). Units that remain stationary do not trigger any rules that are triggered when a unit starts or ends a move.</description>
    </rule>
    <rule id="c17d-dc64-eecf-f1ae" name="Core Rule: Normal Move (09.05)" publicationId="48fc-15aa-b307-9443" page="32" hidden="false">
      <description>**MAXIMUM DISTANCE:** Your unit’s M characteristic.
**ELIGIBLE IF:** Your unit is on the battlefield and unengaged.
**EFFECT:** Your unit moves (no model within Engagement Range of enemies).
**AFTER MOVING:** Your unit must be unengaged.</description>
    </rule>
    <rule id="7528-fd2e-72b9-3590" name="Core Rule: Advance Move (09.06)" publicationId="48fc-15aa-b307-9443" page="32" hidden="false">
      <description>**MAXIMUM DISTANCE:** Advance roll (1D6) + your unit’s M characteristic.
**ELIGIBLE IF:** Your unit is on the battlefield and unengaged.
**BEFORE MOVING:** Make an Advance roll of one D6.
**AFTER MOVING:** Your unit must be unengaged, and until the end of the turn (unless otherwise stated) it is not eligible to declare a charge or start an action. It also cannot shoot unless it has [ASSAULT] weapons (Assault shooting).</description>
    </rule>
    <rule id="e4cd-d46b-d7a6-7166" name="Core Rule: Fall-Back Move (09.07)" publicationId="48fc-15aa-b307-9443" page="32" hidden="false">
      <description>**MAXIMUM DISTANCE:** Your unit’s M characteristic.
**ELIGIBLE IF:** Your unit is engaged.
**BEFORE MOVING — select a mode:**
- **Ordered Retreat:** available if your unit is not battle-shocked.
- **Desperate Escape:** otherwise mandatory. Make a Hazard roll for each model in your unit.
**WHILE MOVING:** Desperate Escape models can move through enemy models.
**AFTER MOVING:** Your unit must be unengaged, and until the end of the turn it is not eligible to shoot, declare a charge or start an action. (Desperate Escape: if not battle-shocked, make a battle-shock roll.)</description>
    </rule>
    <rule id="7f10-badc-6eb2-c3f5" name="Core Rule: Shooting Types (10)" publicationId="48fc-15aa-b307-9443" page="34" hidden="false">
      <description>When a unit is selected to shoot, choose one shooting type it is eligible for:
- **Normal Shooting (10.04):** unit is unengaged and did not Advance this turn.
- **Assault Shooting (10.05):** unit is unengaged and made an Advance this turn; can only use [ASSAULT] weapons.
- **Close-quarters Shooting (10.06):** unit is engaged and did not Advance; can target units it is engaged with. Non-MONSTER/VEHICLE models may only use [CLOSE-QUARTERS] weapons against engaged units; MONSTER/VEHICLE models suffer -1 to Hit unless using a [CLOSE-QUARTERS] weapon against an engaged unit.
- **Indirect Shooting (10.07):** unit is unengaged, did not Advance, and has [INDIRECT FIRE] weapons; those weapons can target units that are not visible (target gains cover, no re-rolls, unmodified Hit of 1-5 fails unless stationary with a friendly spotter).</description>
    </rule>
    <rule id="2b30-9e7f-1ef3-6ead" name="Core Rule: Charge Phase (11)" publicationId="48fc-15aa-b307-9443" page="36" hidden="false">
      <description>**Declare Charge (11.02):** A unit is eligible to declare a charge if it is on the battlefield, within 12" of one or more enemy units, is not engaged, and did not Advance or Fall Back this turn.
**Charge Roll:** Roll 2D6 — the result is the maximum charge distance.
**Charge Move (11.04):** Before moving, select charge targets (enemy units within 12" and within the maximum distance). Each model must end closer to a charge target, and end within Engagement Range of one or more targets if able. After moving, your unit must be engaged with ALL its charge targets and must not be engaged with non-target enemy units. Until the end of the turn, models in a charging unit have the Fights First ability.</description>
    </rule>
    <rule id="33dc-d8d1-0469-0c05" name="Core Rule: Fight Phase (12)" publicationId="48fc-15aa-b307-9443" page="38" hidden="false">
      <description>The Fight phase resolves in steps: **Pile In → Fight → Consolidate**.
- **Pile-in Move (12.03):** up to 3"; each model must end closer to the nearest enemy model.
- **Fight (12.04):** Resolve Fights First combats first (units that charged or have Fights First), then players alternate selecting units to fight, starting with the player whose turn it is NOT. A selected unit piles in, makes melee attacks, then consolidates.
- **Consolidate (12.08):** up to 3"; move toward the nearest enemy unit / objective as allowed.</description>
    </rule>
    <rule id="f12d-58f5-c28f-692e" name="Damaged" publicationId="48fc-15aa-b307-9443" hidden="false">
      <description>This ability always takes the form Damaged X. While a model’s remaining wounds are equal to or less than X, that model is damaged:
■ While a model is damaged, that model’s attacks have -1 to hit rolls.</description>
    </rule>
    <rule name="Hunter (Monster/Vehicle)" hidden="false" id="0d1a-9f3b-7c40-1c06">
      <description>Some weapons have a **[HUNTER: ^^Monster^^/^^Vehicle^^]** profile. Each time a unit is selected to shoot or fight, a weapon profile that has **[HUNTER: ^^Monster^^/^^Vehicle^^]** can only be used to make attacks against a target that is a **^^Monster^^** or **^^Vehicle^^** unit.

This is a targeting restriction that depends on the enemy unit, so the format cannot enforce it automatically: it is descriptive. A consuming app must show it, and only allow that profile to be used against **^^Monster^^**/**^^Vehicle^^** targets.</description>
    </rule>
    <rule name="Devastating Wounds (Infantry)" hidden="false" id="0d1a-9f3b-7c40-1c07">
      <description>Some weapons have **[DEVASTATING WOUNDS: ^^Infantry^^]** in their profile. Each time an attack is made with such a weapon against an **^^Infantry^^** unit, a Critical Wound inflicts Devastating Wounds (mortal wounds equal to the Damage characteristic). This ability has no effect against other targets.</description>
    </rule>
    <rule name="Devastating Wounds (Monster/Vehicle)" hidden="false" id="0d1a-9f3b-7c40-1c08">
      <description>Some weapons have **[DEVASTATING WOUNDS: ^^Monster^^/^^Vehicle^^]** in their profile. Each time an attack is made with such a weapon against a **^^Monster^^** or **^^Vehicle^^** unit, a Critical Wound inflicts Devastating Wounds (mortal wounds equal to the Damage characteristic). This ability has no effect against other targets.</description>
    </rule>
<rule name="Sustained Hits (Monster/Vehicle)" hidden="false" id="0d1a-9f3b-7c40-1c09">
      <description>Weapons with **[SUSTAINED HITS N (^^Monster^^/^^Vehicle^^)]** in their profile only benefit from the Sustained Hits ability against **^^Monster^^** or **^^Vehicle^^** units. Each time an attack is made with such a weapon against a **^^Monster^^** or **^^Vehicle^^** unit, a Critical Hit scores N additional hits. This ability has no effect against other targets.</description>
</rule>
    <rule name="Lethal Hits (non-Monster/Vehicle)" hidden="false" id="0d1a-9f3b-7c40-1c01">
      <description>Weapons with **[LETHAL HITS: non-^^Monster^^/^^Vehicle^^]** in their profile are known as Lethal Hits weapons. Each time an attack is made with such a weapon against a unit that is not a **^^Monster^^** or **^^Vehicle^^** unit, a Critical Hit automatically wounds the target. This ability has no effect against **^^Monster^^** or **^^Vehicle^^** units.</description>
    </rule>
    <rule name="Assault Disembark Move" hidden="false" id="0d1a-9f3b-7c40-1c05">
      <description>A special **move type**.

**Set-up distance:** 3&quot;

**Eligible if:** As stated in the rule allowing this **move type**, if all of the following apply to your unit:
- Embarked within a **^^Transport^^** model that is on the battlefield.
- Did not embark within that **^^Transport^^** this phase.
- That **^^Transport^^** has not made an **Advance/Fall Back move** this phase.

**Effect:** Your unit is set up as described in Set Up (Core Rules, 03.02).

**While moving:**
- Set up each model in your unit wholly within the **set-up distance** of that **^^Transport^^**.</description>
    </rule>
    <rule id="2be5-85fb-e165-e3da" name="Shock Disembark Move" hidden="false">
      <description>A special **move type**.

**Set-up distance:** 3&quot;

**Eligible if:** As stated in the rule allowing this **move type**, if all of the following apply to your unit:
- Embarked within a **^^Transport^^** model that is on the battlefield.
- Did not embark within that **^^Transport^^** this phase.

**Effect:** Your unit is set up as described in Set Up (Core Rules, 03.02).

**While moving:** Set up each model in your unit wholly within the **set-up distance** of that **^^Transport^^**.

**After moving:** Your unit is not **eligible to declare a charge** until the end of the turn.</description>
    </rule>
  </sharedRules>
  <sharedProfiles>
    <profile id="fa4e-5ac8-11a6-78d2" name="Fortification" hidden="false" typeId="9cc3-6d83-4dd3-9b64" typeName="Abilities">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">While an enemy unit is only within Engagement Range of one or more ^^**Fortifications**^^ from your army:
- That unit can still be selected as the target of ranged attacks, but each time such an attack is made, unless it is made with a Pistol, subtract 1 from the Hit roll.
- Models in that unit do not need to take Desperate Escape tests due to Falling Back while Battle-shocked, except for those that will move over enemy models when doing so.</characteristic>
      </characteristics>
    </profile>
    <profile name="Lord of Deceit (Aura)" typeId="9cc3-6d83-4dd3-9b64" typeName="Abilities" hidden="false" id="8332-466b-a51f-63ab">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">Each time your opponent targets a unit from their army with a Stratagem, if that unit is within 12&quot; of this model, increase the cost of that use of that Stratagem by 1CP.</characteristic>
      </characteristics>
    </profile>
    <profile name="Invulnerable Save (4+)" hidden="false" id="5b77-29f8-7b77-75e3" typeName="Abilities" typeId="9cc3-6d83-4dd3-9b64">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">This model has a 4+ invulnerable save.</characteristic>
      </characteristics>
      <comment>Single model</comment>
    </profile>
    <profile name="Invulnerable Save (5+)" hidden="false" id="27f4-7449-a636-ae8c" typeName="Abilities" typeId="9cc3-6d83-4dd3-9b64">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">This model has a 5+ invulnerable save.</characteristic>
      </characteristics>
      <comment>Single model</comment>
    </profile>
    <profile name="Invulnerable Save (4+)" typeId="9cc3-6d83-4dd3-9b64" typeName="Abilities" hidden="false" id="b79a-617-8519-d24f">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">Models in this unit have a 4+ invulnerable save.</characteristic>
      </characteristics>
      <comment>Unit</comment>
    </profile>
    <profile name="Invulnerable Save (6+)" hidden="false" id="42f1-ea3d-3ff9-e56a" typeName="Abilities" typeId="9cc3-6d83-4dd3-9b64">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">Models in this unit have a 6+ invulnerable save.</characteristic>
      </characteristics>
      <comment>Unit</comment>
    </profile>
    <profile name="Invulnerable Save (6+)" hidden="false" id="ae1-4b86-68f7-dd75" typeName="Abilities" typeId="9cc3-6d83-4dd3-9b64">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">This model has a 6+ invulnerable save.</characteristic>
      </characteristics>
      <comment>Single model</comment>
    </profile>
    <profile id="3b8a-73e4-1389-b399" name="Invulnerable Save (5+)" hidden="false" typeId="9cc3-6d83-4dd3-9b64" typeName="Abilities">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">Models in this unit have a 5+ invulnerable save.</characteristic>
      </characteristics>
      <comment>Unit</comment>
    </profile>
    <profile name="Invulnerable Save (5+*)" hidden="false" typeId="9cc3-6d83-4dd3-9b64" typeName="Abilities" id="8552-862d-6a49-4879">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">This model has a 5+ invulnerable save against ranged attacks.</characteristic>
      </characteristics>
      <comment>Single model - ranged only</comment>
    </profile>
    <profile name="Invulnerable Save (4+*)" typeId="9cc3-6d83-4dd3-9b64" typeName="Abilities" hidden="false" id="5a7a-57fa-9801-4e25">
      <characteristics>
        <characteristic name="Description" typeId="9b8f-694b-e5e-b573">This model has a 4+ invulnerable save against ranged attacks.</characteristic>
      </characteristics>
      <comment>Single model - ranged only</comment>
    </profile>
  </sharedProfiles>
</gameSystem>
